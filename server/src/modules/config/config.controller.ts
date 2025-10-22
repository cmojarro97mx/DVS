import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('config')
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get('google-maps-key')
  getGoogleMapsKey() {
    return {
      apiKey: this.configService.get<string>('GOOGLE_MAPS_KEY') || '',
    };
  }
}
