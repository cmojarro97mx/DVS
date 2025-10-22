import { Controller, Get, Query, Res, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { GoogleAuthService } from './google-auth.service';
import { Response, Request } from 'express';

@Controller('google-auth')
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Get('authorize')
  @UseGuards(JwtAuthGuard)
  async authorize(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const authUrl = await this.googleAuthService.getAuthorizationUrl(user.userId);
    res.redirect(authUrl);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  async getAuthUrl(@Req() req: Request) {
    try {
      const user = req.user as any;
      console.log('Getting auth URL for user:', user.userId);
      const authUrl = await this.googleAuthService.getAuthorizationUrl(user.userId);
      console.log('Generated auth URL successfully');
      return { url: authUrl };
    } catch (error) {
      console.error('Error generating auth URL:', error);
      throw error;
    }
  }

  @Get('callback-url')
  async getCallbackUrl() {
    return { callbackUrl: this.googleAuthService.getCallbackUrlPublic() };
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      await this.googleAuthService.handleCallback(code, state);
      
      // Detectar si es un popup (viene de window.open) o redirección completa
      // Enviamos una página HTML que cierra el popup o redirige
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Conectando con Google...</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
            }
            .spinner {
              border: 4px solid rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              border-top: 4px solid white;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h2>¡Conectado exitosamente!</h2>
            <p>Cerrando ventana...</p>
          </div>
          <script>
            // Si es un popup, enviar mensaje al parent
            if (window.opener) {
              window.opener.postMessage({ type: 'oauth-success' }, '*');
              setTimeout(() => window.close(), 1000);
            } else {
              // Si es redirección completa (móvil), redirigir al dashboard
              setTimeout(() => window.location.href = '/dashboard?oauth=success', 1000);
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error de conexión</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
            }
            .container {
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Error al conectar</h2>
            <p>Por favor intenta de nuevo.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'oauth-error' }, '*');
              setTimeout(() => window.close(), 2000);
            } else {
              setTimeout(() => window.location.href = '/dashboard?oauth=error', 2000);
            }
          </script>
        </body>
        </html>
      `);
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req: Request) {
    const user = req.user as any;
    return this.googleAuthService.getConnectionStatus(user.userId);
  }

  @Get('disconnect')
  @UseGuards(JwtAuthGuard)
  async disconnect(@Req() req: Request) {
    const user = req.user as any;
    await this.googleAuthService.disconnect(user.userId);
    return { message: 'Google account disconnected successfully' };
  }
}
