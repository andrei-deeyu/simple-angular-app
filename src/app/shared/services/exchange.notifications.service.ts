import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Exchange } from 'src/app/dashboard/models/exchange.model';
import { selectCurrentPage, selectExchange } from 'src/app/state/exchange.selectors';
import { CurrentPage } from '../models/currentPage.model';
import { ReplaySubject } from 'rxjs';
import { ExchangeApiActions, ExchangeNotificationsActions } from 'src/app/state/exchange.actions';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { NoInternetConnection } from './Errors/no-internet-connection';
import { AuthService } from '@auth0/auth0-angular';


@Injectable({
  providedIn: 'root'
})
export class ExchangeNotificationsService {
  currentPage$ = this.store.select(selectCurrentPage);
  exchange$ = this.store.select(selectExchange);

  constructor(private store: Store, private router: Router, private authService: AuthService) {}

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

  connect(sessionID: string) {
    this.authService.user$.subscribe(_user => {
      console.log(_user)
      if( !_user ) return;
      let _userId: string | undefined = _user?.sub?.split('auth0|')[1]

      let socket:WebSocketSubject<any> = webSocket(environment.WS_URL + '?' + _userId + '/' + sessionID);
      socket.subscribe({
        next: ( post: any ) => {
          console.log(post)
          if( this.validKeys(post) ) {
            this.currentPage().subscribe(_currentPage => {
              if( this.router.url == '/exchange' && _currentPage.pageActive === 1) {
                post.new = true;
                this.store.dispatch(ExchangeApiActions.addPost({ post }));
              }
              this.store.dispatch(ExchangeNotificationsActions.addNotification({ post }))
            });
          }

          if( post.removed ) {
            let postId = post.removed;
            this.store.dispatch(ExchangeApiActions.removePost({ postId }))
          }

          if( post.liked ) {
            let postId = post.liked;
            let eventValue = post.eventValue;
            this.store.dispatch(ExchangeApiActions.likePost({ postId, eventValue }))
          }
        },
        error: ( err ) => { throw new NoInternetConnection(err) },
        complete: () => console.log('logged out from sockets')
      })
  });
  }
}