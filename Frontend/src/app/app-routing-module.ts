import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { Home } from "./home/home";
import { HostPanel } from "./host-panel/host-panel";
import { HostPanelTripCreation } from "./host-panel-trip-creation/host-panel-trip-creation";
import { TripDetails } from "./trip-details/trip-details";
import { Profile } from "./profile/profile";
import { Login } from "./login/login";
import { authGuard } from "./guards/auth.guard";
import { AllTrips } from "./all-trips/all-trips";
import { About } from "./about/about";
import { Mission } from "./mission/mission";
import { HowItWorks } from "./how-it-works/how-it-works";
import { ContactComponent } from "./contact/contact";
import { HelpCenterComponent } from "./help-center/help-center";
import { CancellationPolicyComponent } from "./cancellation-policy/cancellation-policy";
import { TermsConditionsComponent } from "./terms-conditions/terms-conditions";
import { PrivacyPolicyComponent } from "./privacy-policy/privacy-policy";
import { BecomeHostComponent } from "./become-host/become-host";
import { HostGuidelinesComponent } from "./host-guidelines/host-guidelines";
import { TravellerReviewsComponent } from "./traveller-reviews/traveller-reviews";
// import { AdminDashboard } from "./admin-dashboard/admin-dashboard";
import { adminGuard } from "./guards/admin.guard";
// import { AdminTripConfirmation } from "./admin/admin-trip-confirmation/admin-trip-confirmation";
// import { AdminCategoryComponent } from "./admin/admin-category/admin-category";
import { PaymentComponent } from "./payment/payment";
import { TripChat } from "./chat/trip-chat/trip-chat";

const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  { path: "login", component: Login },
  { path: "payment/:paymentId", component: PaymentComponent },
  { path: "home", component: Home },
  { path: "home/about", component: About },
  { path: "home/mission", component: Mission },
  { path: "home/how-it-works", component: HowItWorks },
  { path: "home/contact", component: ContactComponent },
  { path: "home/help", component: HelpCenterComponent },
  { path: "home/cancellation-policy", component: CancellationPolicyComponent },
  { path: "home/terms-conditions", component: TermsConditionsComponent },
  { path: "home/privacy-policy", component: PrivacyPolicyComponent },
  { path: "home/become-host", component: BecomeHostComponent },
  { path: "home/host-guidelines", component: HostGuidelinesComponent },
  { path: "home/traveller-reviews", component: TravellerReviewsComponent },
  { path: "home/profile", component: Profile },
  { path: "home/allTrips", component: AllTrips },
  { path: "chat", component: TripChat, canActivate: [authGuard] },
  {
    path: "home/tripDetails/:tripId",
    component: TripDetails,
  },
  {
    path: "host/tripDetails/:tripId",
    component: TripDetails,
    canActivate: [authGuard],
  },
  // {
  //   path: "admin",
  //   component: AdminDashboard,
  //   children: [
  //     { path: "trip", component: AdminTripConfirmation },
  //     { path: "category", component: AdminCategoryComponent },
  //   ],
  //   canActivate: [adminGuard],
  // },
  { path: "host", component: HostPanel, canActivate: [authGuard] },
  {
    path: "host/edit",
    component: HostPanelTripCreation,
    canActivate: [authGuard],
  },
  {
    path: "host/edit/:tripId",
    component: HostPanelTripCreation,
    canActivate: [authGuard],
  },

  { path: "**", redirectTo: "/home" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: "top" })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
