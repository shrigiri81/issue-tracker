import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Sidebar />
      <Header />
      <main className="pl-60 pt-[3.25rem] min-h-screen">
        {children}
      </main>
    </div>
  )
}
