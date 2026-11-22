import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostPanelTrips } from './host-panel-trips';

describe('HostPanelTrips', () => {
  let component: HostPanelTrips;
  let fixture: ComponentFixture<HostPanelTrips>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HostPanelTrips]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostPanelTrips);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
