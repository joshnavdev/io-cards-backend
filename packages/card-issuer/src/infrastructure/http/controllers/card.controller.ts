import { type NextFunction, type Request, type Response } from 'express';
import { type IssueCardUseCase } from '../../../application/use-cases/issue-card.use-case.js';
import { type Logger } from '../../../domain/ports/logger.port.js';
import { IssueCardSchema } from '../validators/issue-card.schema.js';

export class CardController {
  constructor(
    private readonly useCase: IssueCardUseCase,
    private readonly logger: Logger,
  ) {}

  issueCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = IssueCardSchema.parse(req.body);
      this.logger.info('Issue card request received', {
        documentNumber: parsed.customer.documentNumber,
      });
      const result = await this.useCase.execute(parsed);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  };

  health = (_req: Request, res: Response): void => {
    res.status(200).json({ status: 'ok', service: 'card-issuer' });
  };
}
