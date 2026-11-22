import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostPanelTripCreationConfirmation } from './host-panel-trip-creation-confirmation';

describe('HostPanelTripCreationConfirmation', () => {
  let component: HostPanelTripCreationConfirmation;
  let fixture: ComponentFixture<HostPanelTripCreationConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HostPanelTripCreationConfirmation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostPanelTripCreationConfirmation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
