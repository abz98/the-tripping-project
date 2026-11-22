import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripChat } from './trip-chat';

describe('TripChat', () => {
  let component: TripChat;
  let fixture: ComponentFixture<TripChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TripChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripChat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
