import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SearchService {
  private searchTriggered = new Subject<any>();

  searchTriggered$ = this.searchTriggered.asObservable();

  triggerSearch(searchParams: any) {
    this.searchTriggered.next(searchParams);
  }
}
