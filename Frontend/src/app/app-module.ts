import { NgModule, provideBrowserGlobalErrorListeners } from "@angular/core";
import {
  BrowserModule,
  provideClientHydration,
  withEventReplay,
} from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import { authInterceptor } from "./interceptors/auth.interceptor";

import { AppRoutingModule } from "./app-routing-module";
import { App } from "./app";
import { Header } from "./header/header";
import { Banners } from "./banners/banners";
import { SearchBar } from "./search-bar/search-bar";
import { Category } from "./category/category";
import { Trips } from "./trips/trips";
import { Footer } from "./footer/footer";
import { HostPanel } from "./host-panel/host-panel";
import { HostPanelTrips } from "./host-panel-trips/host-panel-trips";
import { HostPanelTripCreation } from "./host-panel-trip-creation/host-panel-trip-creation";
import { Home } from "./home/home";
import { HostPanelTripCreationConfirmation } from "./host-panel-trip-creation-confirmation/host-panel-trip-creation-confirmation";
import { AllTrips } from "./all-trips/all-trips";
import { TripDetails } from "./trip-details/trip-details";
import { TripDetailsConfirmation } from "./trip-details-confirmation/trip-details-confirmation";
import { Profile } from "./profile/profile";
import { Login } from "./login/login";
import { About } from "./about/about";
import { Mission } from "./mission/mission";
import { HowItWorks } from "./how-it-works/how-it-works";
import { AdminDashboard } from "./admin-dashboard/admin-dashboard";
import { AdminHeadersComponent } from "./admin/admin-headers/admin-headers";
import { AdminTripConfirmation } from "./admin/admin-trip-confirmation/admin-trip-confirmation";
import { AdminCategoryComponent } from "./admin/admin-category/admin-category";
import { PaymentComponent } from "./payment/payment";
import { TripChat } from './chat/trip-chat/trip-chat';
@NgModule({
  declarations: [
    App,
    Header,
    Banners,
    SearchBar,
    Category,
    Trips,
    Footer,
    HostPanel,
    HostPanelTrips,
    HostPanelTripCreation,
    Home,
    HostPanelTripCreationConfirmation,
    AllTrips,
    TripDetails,
    TripDetailsConfirmation,
    Profile,
    Login,
    About,
    Mission,
    HowItWorks,
    AdminDashboard,
    AdminHeadersComponent,
    AdminTripConfirmation,
    AdminCategoryComponent,
    PaymentComponent,
    TripChat,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
