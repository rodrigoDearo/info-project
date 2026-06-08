import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: string[] | undefined = undefined; // <-- Tipagem explícita aqui

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as Record<string, unknown>;
      message = Array.isArray(body.message) ? 'Validation error' : (body.message as string) ?? message;
      details = Array.isArray(body.message) ? body.message : undefined;
    } else {
      this.logger.error(`Unhandled exception at ${request.method} ${request.url}`, (exception as Error)?.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(details && { details }),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

