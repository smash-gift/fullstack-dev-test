import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (status === HttpStatus.SERVICE_UNAVAILABLE) {
        this.logger.warn(
          `Service Unavailable Exception (RN04): ${JSON.stringify(exceptionResponse)}`,
        );
        return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          error: 'Service Unavailable',
          message:
            'O serviço de sugestões de IA está temporariamente indisponível. Tente novamente em instantes.',
          code: 'LLM_SERVICE_UNAVAILABLE',
        });
      }

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        return response.status(status).json(exceptionResponse);
      }

      return response.status(status).json({
        statusCode: status,
        message: exceptionResponse,
      });
    }

    this.logger.error('Unhandled internal server exception', exception);

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Ocorreu um erro interno inesperado.',
    });
  }
}
