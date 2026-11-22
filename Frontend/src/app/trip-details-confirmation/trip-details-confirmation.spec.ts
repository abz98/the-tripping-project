import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripDetailsConfirmation } from './trip-details-confirmation';

describe('TripDetailsConfirmation', () => {
  let component: TripDetailsConfirmation;
  let fixture: ComponentFixture<TripDetailsConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TripDetailsConfirmation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripDetailsConfirmation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
