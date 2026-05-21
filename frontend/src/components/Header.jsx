import { colors } from '../constants/colors'

export default function Header({ tasks = [] }) {
  const completedCount = tasks.filter((task) => task.status === 'DONE').length
  const totalCount = tasks.length

  return (
    <div
      style={{
        backgroundColor: colors.headerBackground,
        borderBottom: `1px solid ${colors.borderColor}`,
        height: '56px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: '18px',
        }}
      >
        ⚡ TaskMind AI
      </div>

      <div
        style={{
          color: '#9CA3AF',
          fontSize: '14px',
        }}
      >
        {completedCount} of {totalCount} done
      </div>
    </div>
  )
}
