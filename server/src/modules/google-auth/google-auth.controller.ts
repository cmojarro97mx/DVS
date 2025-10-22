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

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      await this.googleAuthService.handleCallback(code, state);
      res.redirect('/dashboard?oauth=success');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/dashboard?oauth=error');
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
