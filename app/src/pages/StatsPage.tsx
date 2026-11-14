import { useI18n } from '../lib/i18n'

export default function StatsPage() {
  const { t } = useI18n()
  return <h1>{t.stats}</h1>
}
