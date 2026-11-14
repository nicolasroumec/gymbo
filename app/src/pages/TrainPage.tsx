import { useI18n } from '../lib/i18n'

export default function TrainPage() {
  const { t } = useI18n()
  return <h1>{t.train}</h1>
}
