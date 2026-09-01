import * as React from 'react'
import moment from 'moment'
import {fireEvent, render} from '@testing-library/react'
import {RegionalPressureForm} from '../../components/regionalpressure/RegionalPressureForm'

const renderForm = (requestRegion: jest.Mock = jest.fn(), props: Partial<React.ComponentProps<typeof RegionalPressureForm>> = {}) => {
  const queries = render(
    <RegionalPressureForm
      availablePorts={['LHR']}
      errors={[]}
      forecastEnd="2026-06-11"
      forecastStart="2026-06-10"
      historicEnd="2025-06-12"
      historicStart="2025-06-11"
      initialComparisonType="previousYear"
      ports={['LHR']}
      requestRegion={requestRegion}
      singleOrRange="single"
      status=""
      {...props}
    />
  )

  return {requestRegion, ...queries}
}

describe('<RegionalPressureForm />', () => {
  it('requests data on mount with current defaults', () => {
    const {requestRegion} = renderForm()

    expect(requestRegion).toHaveBeenCalledTimes(1)
    expect(requestRegion).toHaveBeenLastCalledWith(
      ['LHR'],
      ['LHR'],
      'single',
      'previousYear',
      moment('2026-06-10').format('YYYY-MM-DD'),
      moment('2026-06-11').format('YYYY-MM-DD'),
      false,
      moment('2025-06-11').format('YYYY-MM-DD'),
      moment('2025-06-12').format('YYYY-MM-DD'),
    )
  })

  it('updates to date range and shows end date field', () => {
    const {requestRegion, getByLabelText, getAllByLabelText} = renderForm()

    fireEvent.click(getByLabelText('Date range'))

    expect(requestRegion).toHaveBeenLastCalledWith(
      ['LHR'],
      ['LHR'],
      'range',
      'previousYear',
      moment('2026-06-10').format('YYYY-MM-DD'),
      moment('2026-06-11').format('YYYY-MM-DD'),
      false,
      moment('2025-06-11').format('YYYY-MM-DD'),
      moment('2025-06-12').format('YYYY-MM-DD'),
    )
    expect(getAllByLabelText('To').length).toBeGreaterThan(0)
  })

  it('updates to custom comparison and reveals custom comparison date picker', () => {
    const {requestRegion, getByLabelText, getAllByLabelText} = renderForm()

    expect(getAllByLabelText('Date')).toHaveLength(1)

    fireEvent.click(getByLabelText('Custom date'))

    expect(requestRegion).toHaveBeenLastCalledWith(
      ['LHR'],
      ['LHR'],
      'single',
      'custom',
      moment('2026-06-10').format('YYYY-MM-DD'),
      moment('2026-06-11').format('YYYY-MM-DD'),
      false,
      moment('2025-06-11').format('YYYY-MM-DD'),
      moment('2025-06-12').format('YYYY-MM-DD'),
    )
    expect(getAllByLabelText('Date')).toHaveLength(2)
  })

  it('switches custom comparison label when date range is selected', () => {
    const {getByLabelText, queryByLabelText} = renderForm()

    expect(queryByLabelText('Custom date range')).toBeNull()

    fireEvent.click(getByLabelText('Date range'))

    expect(getByLabelText('Custom date range')).toBeInTheDocument()
  })

  it('normalizes an unpadded typed custom comparison date before requesting data', () => {
    const {requestRegion, getByLabelText, getAllByLabelText} = renderForm()

    fireEvent.click(getByLabelText('Custom date'))
    const customDate = getAllByLabelText('Date')[1]
    fireEvent.change(customDate, {target: {value: '1/8/2026'}})
    fireEvent.blur(customDate)

    expect(requestRegion).toHaveBeenLastCalledWith(
      ['LHR'],
      ['LHR'],
      'single',
      'custom',
      '2026-06-10',
      '2026-06-11',
      false,
      '2026-08-01',
      '2026-08-02',
    )
  })

  it('does not request data after clearing a forecast date and changing mode', () => {
    const {requestRegion, getByLabelText} = renderForm()

    const forecastDate = getByLabelText('Date')
    fireEvent.change(forecastDate, {target: {value: ''}})
    fireEvent.blur(forecastDate)
    fireEvent.click(getByLabelText('Date range'))

    expect(requestRegion).toHaveBeenCalledTimes(1)
  })

  it('does not request data after clearing a custom comparison date', () => {
    const {requestRegion, getByLabelText, getAllByLabelText} = renderForm()

    fireEvent.click(getByLabelText('Custom date'))
    expect(requestRegion).toHaveBeenCalledTimes(2)

    const customDate = getAllByLabelText('Date')[1]
    fireEvent.change(customDate, {target: {value: ''}})
    fireEvent.blur(customDate)

    expect(requestRegion).toHaveBeenCalledTimes(2)
  })

  it('does not request data for invalid initial dates', () => {
    const requestRegion = jest.fn()
    const {getByLabelText} = renderForm(requestRegion, {forecastStart: 'not-a-date'})

    expect(getByLabelText('Date')).toHaveValue('')
    expect(requestRegion).not.toHaveBeenCalled()
  })

  it('normalizes legacy JavaScript date strings supplied by existing state', () => {
    const requestRegion = jest.fn()
    const {getByLabelText} = renderForm(requestRegion, {forecastStart: 'Wed Jun 10 2026 00:00:00 GMT+0100 (British Summer Time)'})

    expect(getByLabelText('Date')).toHaveValue('10/06/2026')
    expect(requestRegion).toHaveBeenLastCalledWith(
      ['LHR'],
      ['LHR'],
      'single',
      'previousYear',
      '2026-06-10',
      '2026-06-11',
      false,
      '2025-06-11',
      '2025-06-12',
    )
  })
})
