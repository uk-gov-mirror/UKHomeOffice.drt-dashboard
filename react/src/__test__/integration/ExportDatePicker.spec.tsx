import * as React from 'react'
import {fireEvent, render} from '@testing-library/react'
import axios from 'axios'
import ExportDatePicker from '../../components/ExportDatePicker'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('<ExportDatePicker />', () => {
  const renderPicker = () => {
    const handleClose = jest.fn()
    const queries = render(<ExportDatePicker region="North" handleClose={handleClose}/>)
    return {handleClose, ...queries}
  }

  beforeEach(() => {
    mockedAxios.post.mockResolvedValue({data: 'ok'} as any)
  })

  it('posts selected dates using the unchanged YYYY-MM-DD payload', () => {
    const {getAllByRole, getByRole} = renderPicker()

    const fields = getAllByRole('textbox')
    fireEvent.change(fields[0], {target: {value: '1/8/2026'}})
    fireEvent.blur(fields[0])
    fireEvent.change(fields[1], {target: {value: '02/08/2026'}})
    fireEvent.blur(fields[1])
    fireEvent.click(getByRole('button', {name: 'Request export'}))

    expect(mockedAxios.post).toHaveBeenCalledWith('/api/export-region', {
      region: 'North',
      startDate: '2026-08-01',
      endDate: '2026-08-02',
    })
  })

  it('clears a date and disables the request until both dates are selected', () => {
    const {getAllByRole, getByRole} = renderPicker()

    const fields = getAllByRole('textbox')
    fireEvent.change(fields[0], {target: {value: '01/08/2026'}})
    fireEvent.blur(fields[0])
    expect(getByRole('button', {name: 'Request export'})).toBeDisabled()

    fireEvent.change(fields[0], {target: {value: ''}})
    fireEvent.blur(fields[0])
    expect(fields[0]).toHaveValue('')
    expect(getByRole('button', {name: 'Request export'})).toBeDisabled()
  })

  it('rejects an end date before the start date', () => {
    const {getAllByRole, getByRole} = renderPicker()

    const fields = getAllByRole('textbox')
    fireEvent.change(fields[0], {target: {value: '02/08/2026'}})
    fireEvent.blur(fields[0])
    fireEvent.change(fields[1], {target: {value: '01/08/2026'}})
    fireEvent.blur(fields[1])

    expect(getByRole('button', {name: 'Request export'})).toBeDisabled()
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })
})
