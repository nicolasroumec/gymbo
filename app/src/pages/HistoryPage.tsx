import { useI18n } from '../lib/i18n'

export default function HistoryPage() {
  const { t } = useI18n()
  return <h1>{t.history}</h1>
}
