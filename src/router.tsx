import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
    },
  ],
  {
    basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
  }
)

export default function Router() {
  return <RouterProvider router={router} />
}
