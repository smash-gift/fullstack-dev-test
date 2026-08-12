import {
  HttpException,
  HttpStatus,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

describe('HttpExceptionFilter (RN04)', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('[RN04] deve retornar HTTP 503 com body padronizado para ServiceUnavailableException', () => {
    const exception = new ServiceUnavailableException(
      'O serviço de sugestões de IA está temporariamente indisponível. Tente novamente em instantes.',
    );

    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const host = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({ status: statusMock }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'Service Unavailable',
      message:
        'O serviço de sugestões de IA está temporariamente indisponível. Tente novamente em instantes.',
      code: 'LLM_SERVICE_UNAVAILABLE',
    });
  });

  it('[API-contract] deve retornar BadRequestException com objeto como body', () => {
    const exceptionResponse = {
      statusCode: 400,
      error: 'Bad Request',
      message: ['occasion must be a string'],
    };
    const exception = new BadRequestException(exceptionResponse);

    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const host = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({ status: statusMock }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it('[API-contract] deve retornar HttpException com string como body com statusCode e message', () => {
    const exception = new HttpException(
      'Forbidden resource',
      HttpStatus.FORBIDDEN,
    );

    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const host = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({ status: statusMock }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: HttpStatus.FORBIDDEN,
      message: 'Forbidden resource',
    });
  });

  it('[AGENTS.md] deve retornar HTTP 500 com mensagem genérica para exceções não-HTTP', () => {
    const exception = new Error('Something unexpected happened');

    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const host = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({ status: statusMock }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Ocorreu um erro interno inesperado.',
    });
  });
});
