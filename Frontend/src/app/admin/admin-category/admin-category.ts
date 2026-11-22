import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { AdminService, AdminCategory } from "../../services/admin.service";
import { finalize } from "rxjs/operators";

@Component({
  selector: "app-admin-category",
  standalone: false,
  templateUrl: "./admin-category.html",
  styleUrls: ["./admin-category.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoryComponent implements OnInit {
  categories: AdminCategory[] = [];
  filteredCategories: AdminCategory[] = [];
  paginatedCategories: AdminCategory[] = [];

  searchTerm: string = "";
  pageSize: number = 10;
  currentPage: number = 1;
  activeDropdown: string | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  filterType: string = "ALL";

  // Modal state
  showModal: boolean = false;
  modalMode: "create" | "edit" = "create";
  selectedCategory: AdminCategory | null = null;

  // Form data
  categoryForm = {
    name: "",
    type: "EXPERIENCE" as "EXPERIENCE" | "DESTINATION" | "SEASON",
    icon_file: null as File | null,
    is_active: true,
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.adminService
      .getCategories()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (response.status === "success" && response.data) {
            this.categories = response.data;
            this.applyFilters();
          }
        },
        error: (error: any) => {
          console.error("Error loading categories:", error);
          this.error = "Failed to load categories. Please try again.";
          this.categories = [];
          this.filteredCategories = [];
          this.paginatedCategories = [];
          this.cdr.markForCheck();
        },
      });
  }

  applyFilters(): void {
    let filtered = [...this.categories];

    // Filter by type
    if (this.filterType !== "ALL") {
      filtered = filtered.filter((cat) => cat.type === this.filterType);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cat) =>
          cat.name.toLowerCase().includes(term) ||
          cat.type.toLowerCase().includes(term) ||
          cat.id.toLowerCase().includes(term),
      );
    }

    this.filteredCategories = filtered;
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.markForCheck();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterTypeChange(): void {
    this.applyFilters();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.markForCheck();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedCategories = this.filteredCategories.slice(
      startIndex,
      endIndex,
    );
    this.cdr.markForCheck();
  }

  goToPage(page: number): void {
    const totalPages = this.getTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredCategories.length / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredCategories.length
      ? this.filteredCategories.length
      : end;
  }

  toggleDropdown(categoryId: string): void {
    this.activeDropdown =
      this.activeDropdown === categoryId ? null : categoryId;
    this.cdr.markForCheck();
  }

  isLastOrSecondLast(index: number): boolean {
    const totalItems = this.paginatedCategories.length;
    return index >= totalItems - 2;
  }

  getTypeClass(type: string): string {
    const typeMap: { [key: string]: string } = {
      EXPERIENCE: "bg-info",
      DESTINATION: "bg-success",
      SEASON: "bg-warning",
    };
    return typeMap[type] || "bg-secondary";
  }

  openCreateModal(): void {
    this.modalMode = "create";
    this.categoryForm = {
      name: "",
      type: "EXPERIENCE",
      icon_file: null,
      is_active: true,
    };
    this.showModal = true;
    this.cdr.markForCheck();
  }

  openEditModal(category: AdminCategory): void {
    this.modalMode = "edit";
    this.selectedCategory = category;
    this.categoryForm = {
      name: category.name,
      type: category.type,
      icon_file: null,
      is_active: category.is_active,
    };
    this.showModal = true;
    this.activeDropdown = null;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedCategory = null;
    this.categoryForm = {
      name: "",
      type: "EXPERIENCE",
      icon_file: null,
      is_active: true,
    };
    this.cdr.markForCheck();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.categoryForm.icon_file = file;
      this.cdr.markForCheck();
    }
  }

  submitCategory(): void {
    const formData = new FormData();
    formData.append("name", this.categoryForm.name);
    formData.append("type", this.categoryForm.type);
    formData.append("is_active", String(this.categoryForm.is_active));

    if (this.categoryForm.icon_file) {
      formData.append("icon", this.categoryForm.icon_file);
    }

    if (this.modalMode === "create") {
      this.adminService.createCategory(formData).subscribe({
        next: () => {
          this.closeModal();
          this.loadCategories();
        },
        error: (error: any) => {
          console.error("Error creating category:", error);
          alert("Failed to create category. Please try again.");
        },
        complete: () => {
          this.closeModal();
        },
      });
    } else if (this.modalMode === "edit" && this.selectedCategory) {
      this.adminService
        .updateCategory(this.selectedCategory.id, formData)
        .subscribe({
          next: () => {
            this.closeModal();
            this.loadCategories();
          },
          error: (error: any) => {
            console.error("Error updating category:", error);
            alert("Failed to update category. Please try again.");
          },
          complete: () => {
            this.closeModal();
          },
        });
    }
  }

  toggleStatus(category: AdminCategory): void {
    this.activeDropdown = null;
    const newStatus = !category.is_active;

    this.adminService.toggleCategoryStatus(category.id, newStatus).subscribe({
      next: () => {
        category.is_active = newStatus;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error("Error toggling category status:", error);
        alert("Failed to update category status. Please try again.");
      },
    });
  }

  deleteCategory(categoryId: string): void {
    if (
      confirm(
        "Are you sure you want to delete this category? This action cannot be undone.",
      )
    ) {
      this.activeDropdown = null;
      this.cdr.markForCheck();

      this.adminService.deleteCategory(categoryId).subscribe({
        next: () => {
          this.loadCategories();
        },
        error: (error: any) => {
          console.error("Error deleting category:", error);
          alert("Failed to delete category. Please try again.");
        },
      });
    } else {
      this.activeDropdown = null;
      this.cdr.markForCheck();
    }
  }
}
