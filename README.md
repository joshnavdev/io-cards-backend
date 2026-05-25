# IO Card Issuance — Sistema de Emisión de Tarjetas

Sistema de emisión de tarjetas para nuevos clientes con arquitectura basada en eventos. Dos aplicaciones independientes (`card-issuer` HTTP y `card-processor` Kafka worker) que se comunican únicamente por eventos. Regla central: cada cliente solo puede tener una única tarjeta.

## Stack

| Componente | card-issuer | card-processor |
|---|---|---|
| Entry point | Express `app.listen()` | Kafka `consumer.subscribe()` |
| HTTP | Express 5 + Helmet + CORS + rate-limit | NO HTTP |
| Messaging | KafkaJS Producer | KafkaJS Consumer + Producer |
| Validation | Zod 4 + Value Objects | Value Objects |
| Logging | Pino 10 (JSON, redact) | Pino 10 (JSON, redact) |
| Env config | Zod | Zod |
| Tests | Vitest + supertest | Vitest |
| TypeScript | 6.x strict | 6.x strict |

Runtime: Node 22 LTS. Monorepo con npm workspaces (3 paquetes: `shared`, `card-issuer`, `card-processor`).

## Estructura del proyecto

```
io-cards-backend/
├── docker-compose.yml
├── package.json (workspaces)
├── tsconfig.base.json
├── eslint.config.js
├── packages/
│   ├── shared/          → Solo tipos: CloudEvent, payloads, topics
│   ├── card-issuer/     → REST API + Kafka producer (Onion)
│   └── card-processor/  → Kafka worker (Onion)
```

## Setup

### Prerrequisitos

- Node 22+ (`nvm use 22`)
- Docker / OrbStack / Docker Desktop corriendo (para Kafka)

### Instalación

```bash
git clone <repo>
cd io-cards-backend
npm install
cp .env.example .env
```

### Levantar todo con Docker Compose

```bash
docker compose up --build
```

Esto arranca Kafka + card-issuer (puerto 3000) + card-processor.

### Levantar en modo desarrollo (Kafka en Docker, servicios en host)

```bash
docker compose up -d kafka
npm run dev:issuer       # terminal 1
npm run dev:processor    # terminal 2
```

## Ejemplos curl

### 1. Solicitud exitosa

```bash
curl -X POST http://localhost:3000/cards/issue \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "documentType": "DNI",
      "documentNumber": "12345678",
      "fullName": "Juan Perez",
      "age": 25,
      "email": "juan@example.com"
    },
    "product": { "type": "VISA", "currency": "PEN" },
    "forceError": false
  }'
```

Respuesta: `202 { "requestId": "<uuid>", "status": "PENDING" }`. Verás el evento `io.cards.issued.v1` en logs del processor.

### 2. Validación fallida (DNI inválido)

```bash
curl -X POST http://localhost:3000/cards/issue \
  -H "Content-Type: application/json" \
  -d '{
    "customer": { "documentType": "DNI", "documentNumber": "abc", "fullName": "X", "age": 25, "email": "a@b.co" },
    "product": { "type": "VISA", "currency": "PEN" },
    "forceError": false
  }'
```

Respuesta: `400 { "code": "VALIDATION_ERROR", "details": [...] }`.

### 3. Cliente duplicado (regla "una tarjeta por cliente")

Repetir la solicitud 1 con el mismo DNI: respuesta `409 { "code": "BUSINESS_RULE_VIOLATION" }`.

### 4. forceError → DLQ

```bash
curl -X POST http://localhost:3000/cards/issue \
  -H "Content-Type: application/json" \
  -d '{
    "customer": { "documentType": "DNI", "documentNumber": "99999999", "fullName": "Test Force", "age": 30, "email": "t@example.com" },
    "product": { "type": "VISA", "currency": "USD" },
    "forceError": true
  }'
```

Respuesta inmediata: `202`. Después de 3 reintentos (1s + 2s + 4s ≈ 7s), aparecerá un evento en `io.card.requested.v1.dlq`.

#### Tip: cómo inspeccionar el DLQ

Mientras `docker compose` esté corriendo, puedes leer el topic `io.card.requested.v1.dlq` usando el CLI que ya viene en el contenedor `io-kafka`:

```bash
docker exec -it io-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic io.card.requested.v1.dlq \
  --from-beginning \
  --property print.headers=true \
  --property print.key=true
```
Otros comandos útiles:

```bash
docker exec -it io-kafka kafka-topics \
  --bootstrap-server localhost:9092 --list

docker exec -it io-kafka kafka-run-class kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 --topic io.card.requested.v1.dlq

docker exec -it io-kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --delete --topic io.card.requested.v1.dlq
```

Flujo end-to-end recomendado para validar el DLQ: dejar un consumer abierto en una terminal con `--from-beginning`, en otra disparar el `curl` del caso 4 con `forceError: true`, y observar cómo después de ~7s (1s + 2s + 4s de backoff) llega el mensaje al DLQ.

### Health check

```bash
curl http://localhost:3000/health
# { "status": "ok", "service": "card-issuer" }
```

## Tests

```bash
npm test                          # corre todos los tests de los workspaces
npm run test -w @io/card-issuer   # solo issuer
npm run test -w @io/card-processor # solo processor
```

Cobertura actual:
- **card-issuer**: 7 archivos de test, 54 tests (5 Value Objects + use case + integration HTTP)
- **card-processor**: 5 archivos de test, 32 tests (CardNumber Luhn, CVV, generador, retry, ProcessCardUseCase)
- **Total: 86 tests** unitarios e integración

## Lint y typecheck

```bash
npm run lint           # ESLint 9 flat config con typescript-eslint strict
npm run typecheck      # tsc --noEmit en los 3 paquetes
npm run format         # Prettier
npm run build          # tsc -b en los 3 paquetes
```

## Tópicos Kafka

| Tópico | Productor | Consumidor | Cuándo |
|---|---|---|---|
| `io.card.requested.v1` | card-issuer | card-processor | Toda solicitud HTTP válida |
| `io.cards.issued.v1` | card-processor | (downstream) | Tarjeta generada con éxito |
| `io.card.requested.v1.dlq` | card-processor | (manual) | 3 reintentos fallidos al servicio externo |

Todos los eventos siguen el formato **CloudEvents 1.0**:

```json
{
  "id": "<uuid>",
  "source": "<requestId>",
  "specversion": "1.0",
  "type": "io.card.requested.v1",
  "time": "2026-05-23T...",
  "datacontenttype": "application/json",
  "data": { /* payload específico */ }
}
```

## Justificación de decisiones

- **Dos apps separadas**: cumple "modular y desacoplado". card-processor no expone HTTP, no carga Express.
- **Onion architecture**: la lógica de negocio no depende de Express ni Kafka. Los ports permiten swap de implementaciones (in-memory ↔ DB real, KafkaJS ↔ otro broker).
- **Value Objects con factory + private constructor**: validación inmutable y centralizada. Si tienes una instancia, está garantizada válida.
- **CloudEvents 1.0**: estándar abierto, soporte multi-broker, headers tipados.
- **Reintentos en aplicación, no Kafka**: control fino del histórico para DLQ.
- **`crypto.randomInt` para datos de tarjeta**: nunca `Math.random()` para datos sensibles. CVV y card number usan crypto.
- **Pino con redact**: card numbers y CVVs nunca aparecen en logs.
- **Helmet + CORS + rate-limit + body 10kb**: defense in depth en card-issuer.
- **`USER node` en Dockerfiles**: non-root execution.
- **In-memory storage**: cumple "DB local o en memoria" de la prueba; cada servicio tiene la suya (no comparten estado).

## Limitaciones / siguiente paso

- Almacenamiento es in-memory: en producción reemplazar `InMemoryCardRequestRepository` por una implementación con DB real (port ya está definido).
- DLQ es solo publishing: implementar consumer de DLQ + UI o herramienta de reprocessing.
- Sin autenticación HTTP: la prueba no la requiere; agregar JWT/OAuth si es necesario.
