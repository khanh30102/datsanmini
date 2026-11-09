import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth.component.html'
})
export class AuthComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly isRegister = signal(false);
  readonly otpSent = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly busy = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });
  readonly otpForm = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const isRegister = params.get('mode') === 'register';
      this.isRegister.set(isRegister);
      const nameControl = this.form.controls.name;
      const phoneControl = this.form.controls.phone;
      if (isRegister) {
        nameControl.addValidators(Validators.required);
        phoneControl.addValidators(Validators.required);
      } else {
        nameControl.removeValidators(Validators.required);
        phoneControl.removeValidators(Validators.required);
      }
      nameControl.updateValueAndValidity();
      phoneControl.updateValueAndValidity();
    });
  }

  toggleMode() {
    this.resetOtpStep();
    this.error.set('');
    this.router.navigate([], { relativeTo: this.route, queryParams: { mode: this.isRegister() ? null : 'register' }, queryParamsHandling: 'merge' });
  }

  submit() {
    this.error.set('');
    this.notice.set('');
    if (this.isRegister() && this.otpSent()) {
      if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
      this.busy.set(true);
      const { phone, password } = this.form.getRawValue();
      this.auth.verifyRegistrationOtp({ phone, password, code: this.otpForm.controls.code.value.trim() }).subscribe({
        next: () => this.finishAuthentication(),
        error: (response) => {
          this.busy.set(false);
          this.error.set(response.error?.message || 'Không thể xác thực mã OTP. Vui lòng thử lại.');
        }
      });
      return;
    }

    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.busy.set(true);
    const { name, email, phone, password } = this.form.getRawValue();
    if (this.isRegister()) {
      this.auth.requestRegistrationOtp({ name, email, phone, password }).subscribe({
        next: ({ message }) => {
          this.busy.set(false);
          this.otpSent.set(true);
          this.notice.set(message);
          this.otpForm.reset({ code: '' });
          this.form.controls.name.disable();
          this.form.controls.email.disable();
          this.form.controls.phone.disable();
          this.form.controls.password.disable();
        },
        error: (response) => {
          this.busy.set(false);
          this.error.set(response.error?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
        }
      });
      return;
    }

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.finishAuthentication();
      },
      error: (response) => {
        this.busy.set(false);
        this.error.set(response.error?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.');
      }
    });
  }

  changeRegistrationDetails() {
    this.resetOtpStep();
    this.error.set('');
    this.notice.set('');
  }

  resendOtp() {
    if (this.busy()) return;
    this.error.set('');
    this.notice.set('');
    this.busy.set(true);
    const { name, email, phone, password } = this.form.getRawValue();
    this.auth.requestRegistrationOtp({ name, email, phone, password }).subscribe({
      next: ({ message }) => {
        this.busy.set(false);
        this.notice.set(message);
      },
      error: (response) => {
        this.busy.set(false);
        this.error.set(response.error?.message || 'Không thể gửi lại mã OTP.');
      }
    });
  }

  private resetOtpStep() {
    this.otpSent.set(false);
    this.otpForm.reset({ code: '' });
    this.form.enable();
  }

  private finishAuthentication() {
    this.busy.set(false);
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    this.router.navigateByUrl(redirect || (this.auth.isAdmin() ? '/admin' : '/'));
  }
}