import { lazy } from 'solid-js';
import type { RouteDefinition } from '@solidjs/router';

import Home from './pages/home';

export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: Home,
  },
  // {
  //   path: '/about',
  //   component: lazy(() => import('./pages/about')),
  //   // data: AboutData,
  // },
  {
    path: '/app',
    component: lazy(() => import('./pages/app')),
  },
  {
    path: '/architecture',
    component: lazy(() => import('./pages/architecture')),
  },
  {
    path: '**',
    component: lazy(() => import('./errors/404')),
  },
];
