declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    nama: string
    role: 'HRD' | 'KARYAWAN'
  }
}

export {}
