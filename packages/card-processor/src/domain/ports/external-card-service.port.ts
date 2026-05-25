export interface ExternalCardService {
  process(input: { requestId: string; forceError: boolean }): Promise<void>;
}
