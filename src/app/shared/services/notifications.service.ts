import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Exchange } from 'src/app/dashboard/models/exchange.model';
import { selectCurrentPage } from 'src/app/state/exchange.selectors';
import { CurrentPage } from '../models/currentPage.model';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { ExchangeApiActions, NotificationActions } from 'src/app/state/exchange.actions';
import { Router } from '@angular/router';

const socket:WebSocketSubject<Exchange> = webSocket('ws://localhost:3000');

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  currentPage$ = this.store.select(selectCurrentPage);

  constructor(private store: Store, private router: Router) {}

  currentPage() {
    let subject = new ReplaySubject<CurrentPage>(1);
    this.currentPage$.subscribe(x => subject.next(x));
    return subject;
  }

  validKeys(_post: Exchange) {
    function instanceOfExchange(object: any, element:any): object is Exchange {
      if(element === 'isLiked') return true;
      return element in object;
    }

    let ExchangeKeys = [
    'userId',
    '_id',
    'title',
    'body',
    'createdAt',
    ];

    let result:Array<boolean> = [];

    ExchangeKeys.forEach((key) => {
      result.push(instanceOfExchange(_post, key))
    })

    if( result.includes(false) ) return false;
    else return true;
  }

   connect() {
    socket.subscribe({
      next: ( post:Exchange ) => {
        if( this.validKeys(post) ) {
          this.currentPage().subscribe(_currentPage => {
            if( this.router.url == '/exchange' && _currentPage.pageActive === 1 ) {
              this.store.dispatch(ExchangeApiActions.addPost({ post }));
            }
            this.store.dispatch(NotificationActions.addNotification({ post }))
          });
        }
      },
      error: ( err ) => console.log(err),
      complete: () => console.log('logged out from sockets')
    })
  }
}