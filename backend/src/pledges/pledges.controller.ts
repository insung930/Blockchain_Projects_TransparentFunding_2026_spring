import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PledgesService } from './pledges.service';
import { AuthorizePledgeDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/types';

@Controller('projects/:projectId/pledges')
export class PledgesController {
  constructor(private readonly pledgesService: PledgesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('authorize')
  authorize(@Param('projectId') projectId: string, @CurrentUser() user: JwtUser, @Body() body: AuthorizePledgeDto) {
    return this.pledgesService.authorize(Number(projectId), user.id, body);
  }
}
