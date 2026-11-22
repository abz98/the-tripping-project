import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostPanelTripCreation } from './host-panel-trip-creation';

describe('HostPanelTripCreation', () => {
  let component: HostPanelTripCreation;
  let fixture: ComponentFixture<HostPanelTripCreation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HostPanelTripCreation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostPanelTripCreation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
