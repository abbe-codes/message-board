import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type PublicUser } from '../users/public-user';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  listMessages(@Query() query: ListMessagesQueryDto) {
    return this.messagesService.list(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createMessage(@CurrentUser() user: PublicUser, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateMessage(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.update(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteMessage(@CurrentUser() user: PublicUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.messagesService.delete(user.id, id);
  }
}
