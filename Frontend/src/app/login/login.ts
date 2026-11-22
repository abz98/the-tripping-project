import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { environment } from "../../environments/environment";

@Component({
  selector: "app-login",
  templateUrl: "./login.html",
  styleUrls: ["./login.css"],
  standalone: false,
})
export class Login implements OnInit {
  isLoginMode = true;
  showOtpScreen = false;
  showForgotPasswordScreen = false;
  showResetPasswordScreen = false;
  registerForm!: FormGroup;
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  resetPasswordForm!: FormGroup;
  isSubmitting = false;
  errorMessage = "";
  successMessage = "";
  returnUrl: string = "/home";
  forgotPasswordEmail = "";

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.initForms();
    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/home";

    // If user is already logged in, redirect them
    if (this.authService.hasToken()) {
      this.router.navigate([this.returnUrl]);
    }

    // Initialize Google Sign-In
    this.initializeGoogleSignIn();
  }

  initializeGoogleSignIn() {
    // Only run in browser (not during SSR)
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // Load Google Sign-In script
    if ((window as any).google) {
      this.renderGoogleButton();
    } else {
      // Load the script if not already loaded
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.renderGoogleButton();
      };
      document.head.appendChild(script);
    }
  }

  renderGoogleButton() {
    // Only run in browser (not during SSR)
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    if (!(window as any).google) {
      return;
    }

    const google = (window as any).google;

    // Initialize Google Sign-In
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleCallback(response),
      auto_select: false,
    });

    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      // Render button for login
      const loginButton = document.getElementById("google-login-btn");
      if (loginButton) {
        google.accounts.id.renderButton(loginButton, {
          theme: "outline",
          size: "large",
          width: loginButton.offsetWidth,
          text: "continue_with",
        });
      }

      // Render button for register
      const registerButton = document.getElementById("google-register-btn");
      if (registerButton) {
        google.accounts.id.renderButton(registerButton, {
          theme: "outline",
          size: "large",
          width: registerButton.offsetWidth,
          text: "continue_with",
        });
      }
    }, 100);
  }

  handleGoogleCallback(response: any) {
    if (!response.credential) {
      this.errorMessage = "Google login failed. Please try again.";
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = "";
    this.successMessage = "";

    this.authService.googleLogin(response.credential).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = res.message || "Login successful!";

        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 500);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.message || "Google login failed. Please try again.";
        console.error("Google login error:", error);
      },
    });
  }

  onGoogleLogin() {
    // Trigger Google Sign-In
    if (typeof window !== "undefined" && (window as any).google) {
      (window as any).google.accounts.id.prompt();
    }
  }

  initForms() {
    // Register Form
    this.registerForm = this.fb.group(
      {
        full_name: ["", [Validators.required, Validators.minLength(2)]],
        email: ["", [Validators.required, Validators.email]],
        password: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
            ),
          ],
        ],
        confirmPassword: ["", Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );

    // Login Form
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
    });

    // Forgot Password Form
    this.forgotPasswordForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
    });

    // Reset Password Form
    this.resetPasswordForm = this.fb.group(
      {
        password: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
            ),
          ],
        ],
        confirmPassword: ["", Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get("password");
    const confirmPassword = form.get("confirmPassword");

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.showOtpScreen = false;
    this.showForgotPasswordScreen = false;
    this.showResetPasswordScreen = false;
    this.errorMessage = "";
    this.successMessage = "";
    this.registerForm.reset();
    this.loginForm.reset();
    this.forgotPasswordForm.reset();
    this.resetPasswordForm.reset();
  }

  showForgotPassword() {
    this.showForgotPasswordScreen = true;
    this.isLoginMode = false;
    this.showOtpScreen = false;
    this.showResetPasswordScreen = false;
    this.errorMessage = "";
    this.successMessage = "";
  }

  backToLogin() {
    this.isLoginMode = true;
    this.showOtpScreen = false;
    this.showForgotPasswordScreen = false;
    this.showResetPasswordScreen = false;
    this.errorMessage = "";
    this.successMessage = "";
    this.forgotPasswordForm.reset();
    this.resetPasswordForm.reset();
  }

  onSubmit() {
    this.errorMessage = "";
    this.successMessage = "";

    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isSubmitting = true;

    const loginData = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = response.message || "Login successful!";

        // Redirect to home page after successful login
        setTimeout(() => {
          this.router.navigate(["/home"]);
        }, 500);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.message ||
          "Login failed. Please check your credentials.";
        console.error("Login error:", error);
      },
    });
  }

  onRegister() {
    this.errorMessage = "";
    this.successMessage = "";

    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isSubmitting = true;

    const registerData = {
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      full_name: this.registerForm.value.full_name,
      role: "USER",
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.isSubmitting = false;
        // Store email in localStorage for OTP verification
        this.authService.setTempEmail(registerData.email);
        this.successMessage =
          "Registration successful! Please verify your email.";
        this.showOtpScreen = true;
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.message || "Registration failed. Please try again.";
        console.error("Registration error:", error);
      },
    });
  }

  onVerifyOtp() {
    this.errorMessage = "";
    this.successMessage = "";

    const otp = this.getOtpValue();
    if (otp.length !== 4) {
      this.errorMessage = "Please enter a valid 4-digit OTP";
      return;
    }

    const email = this.authService.getTempEmail();
    if (!email) {
      this.errorMessage = "Email not found. Please register again.";
      return;
    }

    this.isSubmitting = true;

    const otpData = {
      email: email,
      otp: otp,
    };

    this.authService.verifyOtp(otpData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = response.message || "Verification successful!";

        // Clear temporary email from localStorage
        this.authService.clearTempEmail();

        // Clear OTP inputs
        for (let i = 1; i <= 4; i++) {
          const input = document.getElementById(`otp${i}`) as HTMLInputElement;
          if (input) {
            input.value = "";
          }
        }

        // Redirect to login page after successful verification
        setTimeout(() => {
          this.showOtpScreen = false;
          this.isLoginMode = true;
          this.registerForm.reset();
          this.successMessage = "Email verified! Please login to continue.";
        }, 1500);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.message || "OTP verification failed. Please try again.";
        console.error("OTP verification error:", error);
      },
    });
  }

  onResendOtp() {
    this.errorMessage = "";

    const email = this.authService.getTempEmail();
    if (!email) {
      this.errorMessage = "Email not found. Please register again.";
      return;
    }

    // TODO: Implement resend OTP API call if available
    // For now, just show success message
    this.successMessage = "OTP resent successfully!";
    setTimeout(() => (this.successMessage = ""), 3000);
  }

  onForgotPassword() {
    this.errorMessage = "";
    this.successMessage = "";

    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.isSubmitting = true;
    const email = this.forgotPasswordForm.value.email;
    this.forgotPasswordEmail = email;

    this.authService.forgotPassword({ email }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage =
          response.message || "Password reset OTP sent to your email";
        this.showForgotPasswordScreen = false;
        this.showResetPasswordScreen = true;
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.message ||
          "Failed to send reset email. Please try again.";
        console.error("Forgot password error:", error);
      },
    });
  }

  onResetPassword() {
    this.errorMessage = "";
    this.successMessage = "";

    const otp = this.getOtpValue();
    if (otp.length !== 4) {
      this.errorMessage = "Please enter a valid 4-digit OTP";
      return;
    }

    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched(this.resetPasswordForm);
      return;
    }

    this.isSubmitting = true;

    const resetData = {
      email: this.forgotPasswordEmail,
      otp: otp,
      newPassword: this.resetPasswordForm.value.password,
    };

    this.authService.resetPassword(resetData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = response.message || "Password reset successful!";

        // Clear OTP inputs
        for (let i = 1; i <= 4; i++) {
          const input = document.getElementById(
            `reset-otp${i}`,
          ) as HTMLInputElement;
          if (input) {
            input.value = "";
          }
        }

        // Redirect to login after successful reset
        setTimeout(() => {
          this.backToLogin();
          this.successMessage =
            "Password reset successful! Please login with your new password.";
        }, 1500);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.message || "Password reset failed. Please try again.";
        console.error("Reset password error:", error);
      },
    });
  }

  getOtpValue(): string {
    let otp = "";
    const prefix = this.showResetPasswordScreen ? "reset-" : "";
    for (let i = 1; i <= 4; i++) {
      const input = document.getElementById(
        `${prefix}otp${i}`,
      ) as HTMLInputElement;
      if (input) {
        otp += input.value;
      }
    }
    return otp;
  }

  onOtpInput(event: any, position: number) {
    const input = event.target;
    const value = input.value;

    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      input.value = "";
      return;
    }

    // Move to next input if value is entered
    if (value && position < 4) {
      const prefix = this.showResetPasswordScreen ? "reset-" : "";
      const nextInput = document.getElementById(
        `${prefix}otp${position + 1}`,
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onOtpKeydown(event: any, position: number) {
    const input = event.target;

    // Move to previous input on backspace if current input is empty
    if (event.key === "Backspace" && !input.value && position > 1) {
      const prefix = this.showResetPasswordScreen ? "reset-" : "";
      const prevInput = document.getElementById(
        `${prefix}otp${position - 1}`,
      ) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string, form: FormGroup): string {
    const control = form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return "";
    }

    if (control.errors["required"]) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control.errors["email"]) {
      return "Please enter a valid email address";
    }
    if (control.errors["minlength"]) {
      const minLength = control.errors["minlength"].requiredLength;
      return `${this.getFieldLabel(
        fieldName,
      )} must be at least ${minLength} characters`;
    }
    if (control.errors["pattern"]) {
      return "Password must contain uppercase, lowercase, number and special character";
    }
    if (control.errors["passwordMismatch"]) {
      return "Passwords do not match";
    }
    return "";
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      full_name: "Full name",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
    };
    return labels[fieldName] || fieldName;
  }
}
