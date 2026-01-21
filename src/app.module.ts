import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { UserModule } from './modules/user/user.module';
import { PrismaService } from './prisma/prisma.service';
import { User } from './common/decorators/user.decorator';
import { VideoModule } from './modules/video/video.module';
import { CommentModule } from './modules/comment/comment.module';
import { LikeModule } from './modules/like/like.module';
import { pl } from 'date-fns/locale';
import { PlaylistModule } from './modules/playlist/playlist.module';
import { AlbumModule } from './modules/album/album.module';
import { WatchHistoryModule } from './modules/watch-history/watch-history.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    RolesModule,
    UserModule,
    VideoModule,
    CommentModule,
    LikeModule,
    PlaylistModule,
    AlbumModule,
    WatchHistoryModule,
    RecommendationModule
  ],
  providers: [
    PrismaService
  ],
})
export class AppModule {}
