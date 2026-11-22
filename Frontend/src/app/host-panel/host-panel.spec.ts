import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostPanel } from './host-panel';

describe('HostPanel', () => {
  let component: HostPanel;
  let fixture: ComponentFixture<HostPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HostPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
