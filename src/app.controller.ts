import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { AppService } from './app.service';
import getAppData from './utils';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Get(':url')
  // async findOne(@Param('url') url: string): Promise<any> {
  //   const res = await getAppData(url);
  //   return res;
  // }

  @Post('/app')
  async getAppData(@Body() data: { url: string }): Promise<any> {
    // return this.templateService.create(template);
    const res = await getAppData(data.url);
    return res;
  }
}
