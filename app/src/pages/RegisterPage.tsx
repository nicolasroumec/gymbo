import { useI18n } from '../lib/i18n'

export default function RegisterPage() {
  const { t } = useI18n()
  return <h1>{t.register}</h1>
}
