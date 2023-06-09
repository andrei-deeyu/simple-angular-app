import { Exchange } from '@shared/models/exchange.model';
import { CurrentPage } from '@shared/models/currentPage.model';

export interface AppState {
  exchange: Array<Exchange>,
  singlePost: Exchange,
  exchangeNotifications: Exchange,
  currentPage: CurrentPage
}