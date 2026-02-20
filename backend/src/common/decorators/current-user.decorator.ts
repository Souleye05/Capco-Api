import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // Si une propriété spécifique est demandée, la retourner
    if (data && user && typeof user === 'object') {
      return user[data];
    }
    
    // Sinon retourner l'utilisateur complet
    return user;
  },
);