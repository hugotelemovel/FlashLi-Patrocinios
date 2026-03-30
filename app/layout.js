export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body style={{ margin: 0, backgroundColor: '#f1f5f9', color: '#1e293b', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}