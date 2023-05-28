import { Component, OnInit } from '@angular/core';

import { AppError } from '../../../shared/services/app-error';
import { BadInput } from '../../../shared/services/bad-input';
import { NotFoundError } from '../../../shared/services/not-found-error';


import { FavoriteChangedEventArgs } from '../../../shared/components/favorite/favorite.component';

import { ExchangeService } from '../../services/exchange.service';
import { ExchangeApiActions } from 'src/app/state/exchange.actions';


import { Store } from '@ngrx/store';
import { selectExchange } from 'src/app/state/exchange.selectors';
import { Exchange } from '../../models/exchange.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'exchange',
  templateUrl: './exchange.component.html',
  styleUrls: ['./exchange.component.scss']
})
export class ExchangeComponent implements OnInit {
  exchange$ = this.store.select(selectExchange)
  thePost: any;
  viewMode = '';

  form = new FormGroup({
    title: new FormControl('', [ Validators.required ]),
    body: new FormControl('', [ Validators.required ]),
  });


  constructor (private service: ExchangeService, private store: Store) { }

  ngOnInit() {
    this.service.getAll()
      .subscribe((exchange) =>
        this.store.dispatch(ExchangeApiActions.retrievedExchangePosts({ exchange }))
      );
  }

  createPost(f: FormGroup) {
    let post: any = {
      userId: 1007,
      title: f.value.title,
      body: f.value.body
    };

    f.reset();
    // TODOs: implement optimistic approach
    this.service.create(post)
    .subscribe(
      {
        next: (response:any) => {
          post.id = response.id;
          this.store.dispatch(ExchangeApiActions.addPost({ post }));
        },
        error: (error: AppError) => {
          if(error instanceof BadInput)  {
             // this.form.setErrors(error.originalError)
          } else throw error;
        }
      })
  }

  updatePost(post: any) {
    this.service.update(post)
      .subscribe(response => {
        console.log(response)
      });
  }


  deletePost(postId: number) {
    this.service.remove(postId)
    .subscribe({
      next: () => {
        this.store.dispatch(ExchangeApiActions.removePost({ postId }));
      },
      error: (error: AppError) => {
        if(error instanceof NotFoundError)
          alert('This post already been deleted')
        else throw error;
      }
    })
  }


  onFavoriteChanged(postId: number, eventArgs: FavoriteChangedEventArgs, ) {
    let eventValue = Object.values(eventArgs)[0];
    this.service.likePost(postId, eventValue)
    .subscribe({
      next: () => {
        this.store.dispatch(ExchangeApiActions.likePost({ postId, eventValue }));
      },
      error: (error: AppError) => {

      }
    })
  }
}