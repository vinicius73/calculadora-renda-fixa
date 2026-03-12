const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 3,
})

export function useMoney() {
  return {
    formatMoney: (v: number) => formatter.format(v),
  }
}
