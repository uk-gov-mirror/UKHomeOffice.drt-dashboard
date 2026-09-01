import * as React from 'react'
import moment from 'moment'
import {fireEvent, render} from '@testing-library/react'
import {ConfigValues} from '../../model/Config'
import {UserProfile} from '../../model/User'
import {DownloadManager} from '../../components/downloadmanager/DownloadManager'

const config: ConfigValues = {
  portsByRegion: [{name: 'Central', ports: ['LHR']}],
  ports: [{iata: 'LHR', terminals: ['T2']}],
  domain: 'drt.localhost',
  teamEmail: 'drt@example.com',
}

const user: UserProfile = {
  email: 'user@example.com',
  ports: ['LHR'],
  roles: [],
}

const renderDownloadManager = (requestDownload = jest.fn()) => {
  const queries = render(
    <DownloadManager
      status=""
      createdAt=""
      downloadUrl=""
      errors={[]}
      requestDownload={requestDownload}
      checkDownloadStatus={jest.fn()}
      user={user}
      config={config}
    />,
  )

  return {requestDownload, ...queries}
}

describe('<DownloadManager />', () => {
  it('initialises both dates to today and submits canonical ISO dates', () => {
    const {requestDownload, getByLabelText, getByRole} = renderDownloadManager()
    const today = moment().format('YYYY-MM-DD')

    expect(getByLabelText('Start')).toHaveValue(moment().format('DD/MM/YYYY'))
    expect(getByLabelText('End')).toHaveValue(moment().format('DD/MM/YYYY'))

    fireEvent.click(getByLabelText('LHR'))
    fireEvent.click(getByRole('button', {name: 'Create Report'}))

    expect(requestDownload).toHaveBeenCalledWith(
      [{port: 'LHR', terminals: ['T2']}],
      'passengers-port',
      today,
      today,
    )
  })

  it('normalizes an unpadded typed date before submitting', () => {
    const {requestDownload, getByLabelText, getByRole} = renderDownloadManager()

    const start = getByLabelText('Start')
    fireEvent.change(start, {target: {value: '1/8/2026'}})
    fireEvent.blur(start)
    fireEvent.click(getByLabelText('LHR'))
    fireEvent.click(getByRole('button', {name: 'Create Report'}))

    expect(requestDownload).toHaveBeenCalledWith(
      [{port: 'LHR', terminals: ['T2']}],
      'passengers-port',
      '2026-08-01',
      moment().format('YYYY-MM-DD'),
    )
  })

  it('submits a cleared date as null for the connected dispatch adapter to validate', () => {
    const {requestDownload, getByLabelText, getByRole} = renderDownloadManager()

    const start = getByLabelText('Start')
    fireEvent.change(start, {target: {value: ''}})
    fireEvent.blur(start)
    fireEvent.click(getByLabelText('LHR'))
    fireEvent.click(getByRole('button', {name: 'Create Report'}))

    expect(start).toHaveValue('')
    expect(requestDownload).toHaveBeenCalledWith(
      [{port: 'LHR', terminals: ['T2']}],
      'passengers-port',
      null,
      moment().format('YYYY-MM-DD'),
    )
  })

  it('keeps daily passenger breakdown disabled for a same-day range', () => {
    const {getByLabelText} = renderDownloadManager()

    expect(getByLabelText('Daily passenger breakdown')).toBeDisabled()
  })
})
