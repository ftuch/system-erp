import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export type Plan = 'basic' | 'plus' | 'full';

@Injectable({ providedIn: 'root' })
export class PlanService {
  constructor(private auth: AuthService) {}

  get plan(): Plan {
    return (this.auth.getCurrentUser()?.plan as Plan) || 'basic';
  }

  get isPlus(): boolean {
    return this.plan === 'plus' || this.plan === 'full';
  }

  get isFull(): boolean {
    return this.plan === 'full';
  }

  get planLabel(): string {
    return { basic: 'Basic', plus: 'Plus', full: 'Full' }[this.plan] || 'Basic';
  }

  canUsePedidos(): boolean {
    return this.isPlus;
  }
}
