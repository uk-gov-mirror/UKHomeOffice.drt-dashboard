import * as React from 'react'
import {connect, MapDispatchToProps} from 'react-redux'
import {RootState} from '../../store/redux'
import {Grid} from '@mui/material'
import {DatePicker, IsoDate, Radios} from '@drt/drt-react'
import {requestPaxTotals} from './regionalPressureSagas'
import moment, {Moment} from 'moment'
import {FormError} from '../../services/ValidationService'
import {getHistoricDateByDay} from "./regionalPressureState";

interface RegionalPressureFormProps {
    errors: FormError[]
    ports: string[]
    availablePorts: string[]
    singleOrRange: 'single' | 'range'
    initialComparisonType: 'previousYear' | 'custom',
    forecastStart: string
    forecastEnd: string
    historicStart: string
    historicEnd: string
    status: string
    requestRegion: (ports: string[], availablePorts: string[], singleOrRange: 'single' | 'range', comparisonType: 'previousYear' | 'custom', forecastStart: string, forecastEnd: string, isExport: boolean, historicStart: string, historicEnd: string) => void
}

interface RegionalPressureDatesState {
    start: IsoDate | null
    end: IsoDate | null
}

const toIsoDate = (date: Moment): IsoDate => date.format('YYYY-MM-DD')
const toMoment = (date: IsoDate): Moment => moment(date, 'YYYY-MM-DD', true)
const toInitialIsoDate = (date: string): IsoDate | null => {
    const legacyDate = date.replace(/ \(.+\)$/, '')
    const parsedDate = moment(legacyDate, ['YYYY-MM-DD', 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ'], true)

    return parsedDate.isValid() ? toIsoDate(parsedDate) : null
}

export const RegionalPressureForm = ({
                                  ports,
                                  errors,
                                  availablePorts,
                                  forecastStart,
                                  forecastEnd,
                                  historicStart,
                                  historicEnd,
                                  singleOrRange,
                                  initialComparisonType,
                                  requestRegion
                              }: RegionalPressureFormProps) => {
    const [searchType, setSearchType] = React.useState<'single' | 'range'>(singleOrRange)
    const [comparisonType, setComparisonType] = React.useState<'previousYear' | 'custom'>(initialComparisonType)
    const [forecastDates, setForecastDates] = React.useState<RegionalPressureDatesState>({
        start: toInitialIsoDate(forecastStart),
        end: toInitialIsoDate(forecastEnd),
    })
    const [historicDates, setHistoricDates] = React.useState<RegionalPressureDatesState>({
        start: toInitialIsoDate(historicStart),
        end: toInitialIsoDate(historicEnd),
    })
    const errorFor = (field: string) => errors.find((error: FormError) => error.field === field)?.message
    const forecastRangeError = forecastDates.start && forecastDates.end && forecastDates.start > forecastDates.end
        ? 'The end date must be after the start date.'
        : undefined
    const requestRegionIfComplete = (
        nextSearchType = searchType,
        nextComparisonType = comparisonType,
        nextForecastDates = forecastDates,
        nextHistoricDates = historicDates,
    ): boolean => {
        if (!nextForecastDates.start || !nextHistoricDates.start) return false
        if (nextSearchType === 'range' && (!nextForecastDates.end || !nextHistoricDates.end)) return false

        requestRegion(
            ports,
            availablePorts,
            nextSearchType,
            nextComparisonType,
            nextForecastDates.start,
            nextForecastDates.end ?? nextForecastDates.start,
            false,
            nextHistoricDates.start,
            nextHistoricDates.end ?? nextHistoricDates.start,
        )

        return true
    }

    React.useEffect(() => {
        requestRegionIfComplete()
    }, [])

    const handleSearchTypeChange = (value: string) => {
        const singleOrRange = value as 'single' | 'range';
        setSearchType(singleOrRange)
        requestRegionIfComplete(singleOrRange)
    }

    const handleDateChange = (type: 'start' | 'end', date: IsoDate | null) => {
        const forecastStart = type === 'start' ? date : forecastDates.start
        const forecastEnd = type === 'end' ? date : forecastDates.end

        setForecastDates({
            start: forecastStart,
            end: forecastEnd
        })

        const historicStart = comparisonType === 'previousYear'
            ? forecastStart && toIsoDate(getHistoricDateByDay(toMoment(forecastStart)))
            : historicDates.start
        const historicEnd = comparisonType === 'previousYear'
            ? forecastEnd && toIsoDate(getHistoricDateByDay(toMoment(forecastEnd)))
            : historicDates.end

        const nextHistoricDates = {
            start: historicStart,
            end: historicEnd
        }

        setHistoricDates(nextHistoricDates)
        requestRegionIfComplete(searchType, comparisonType, {start: forecastStart, end: forecastEnd}, nextHistoricDates)
    }

    const handleComparisonTypeChange = (value: string) => {
        const comparisonType = value as 'previousYear' | 'custom'

        const historicStart = comparisonType === 'custom' ?
            historicDates.start :
            forecastDates.start && toIsoDate(getHistoricDateByDay(toMoment(forecastDates.start)))

        const historicEnd = comparisonType === 'custom' ?
            historicDates.end :
            forecastDates.end && toIsoDate(getHistoricDateByDay(toMoment(forecastDates.end)))

        setComparisonType(comparisonType)
        const nextHistoricDates = {
            start: historicStart,
            end: historicEnd
        }
        setHistoricDates(nextHistoricDates)
        requestRegionIfComplete(searchType, comparisonType, forecastDates, nextHistoricDates)
    }

    const handleComparisonDateChange = (comparisonDate: IsoDate | null) => {
        if (!comparisonDate || !forecastDates.start || (searchType === 'range' && !forecastDates.end)) {
            setHistoricDates({start: comparisonDate, end: null})
            return
        }

        const forecastEnd = forecastDates.end ?? forecastDates.start
        const duration = moment.duration(toMoment(forecastEnd).diff(toMoment(forecastDates.start))).asHours()
        const comparisonEnd = toIsoDate(toMoment(comparisonDate).add(duration, 'hours'))

        setHistoricDates({
            start: comparisonDate,
            end: comparisonEnd
        })

        requestRegionIfComplete(searchType, comparisonType, forecastDates, {start: comparisonDate, end: comparisonEnd})
    }

    return (
        <>
            <Grid container spacing={2} justifyItems={'stretch'} sx={{mb: 2}}>
                <Grid item xs={12}>
                    <Radios
                        name="searchType"
                        label="Select date for forecast arrivals"
                        inline
                        small
                        value={searchType}
                        onChange={handleSearchTypeChange}
                        options={[
                            { value: 'single', label: 'Single\u00A0date' },
                            { value: 'range', label: 'Date\u00A0range' }
                        ]}
                    />
                </Grid>
            </Grid>
            <Grid container spacing={2} justifyItems={'stretch'} sx={{mb: 2}}>
                <Grid item>
                    <DatePicker
                        id="regional-pressure-forecast-start"
                        name="startDate"
                        label={searchType == 'single' ? "Date" : "From"}
                        value={forecastDates.start}
                        onChange={(newValue) => handleDateChange('start', newValue)}
                        error={errorFor('startDate')}
                        maxDate={forecastDates.end ?? undefined}/>
                </Grid>
                {searchType === 'range' &&
                    <Grid item>
                        <DatePicker
                            id="regional-pressure-forecast-end"
                            name="endDate"
                            label="To"
                            value={forecastDates.end}
                            onChange={(newValue) => handleDateChange('end', newValue)}
                            error={forecastRangeError || errorFor('endDate')}
                            minDate={forecastDates.start ?? undefined}/>
                    </Grid>
                }
            </Grid>
            <Grid container spacing={2} justifyItems={'stretch'} sx={{mb: 2}}>
                <Grid item xs={12}>
                    <Radios
                        name="comparisonType"
                        label="Select comparison date for historical arrivals (from Border Crossings)"
                        inline
                        small
                        value={comparisonType}
                        onChange={handleComparisonTypeChange}
                        options={[
                            { value: 'previousYear', label: 'Previous\u00A0Year' },
                            { value: 'custom', label: searchType == 'single' ? "Custom\u00A0date" : "Custom\u00A0date\u00A0range" }
                        ]}
                    />
                </Grid>

            </Grid>
            {comparisonType === 'custom' &&
                <Grid container spacing={2} justifyItems={'stretch'} sx={{mb: 2}}>
                    <Grid item>
                        <DatePicker
                            id="regional-pressure-historic-start"
                            name="historicStartDate"
                            label={searchType == 'single' ? "Date" : "From"}
                            value={historicDates.start}
                            onChange={handleComparisonDateChange}
                            error={errorFor('startDate')}/>
                    </Grid>
                    {searchType === 'range' && <Grid item>
                        <DatePicker
                            id="regional-pressure-historic-end"
                            name="historicEndDate"
                            disabled={true}
                            label="To"
                            value={historicDates.end}/>
                    </Grid>}
                </Grid>
            }
        </>
    )
}

const mapDispatch = (dispatch: MapDispatchToProps<any, RegionalPressureFormProps>) => {
    return {
        requestRegion: (
            userPorts: string[],
            availablePorts: string[],
            singleOrRange: 'single' | 'range',
            initialComparisonType: 'previousYear' | 'custom',
            startDate: string,
            endDate: string,
            isExport: boolean,
            historicStart: string,
            historicEnd: string,
        ) => {
            dispatch(requestPaxTotals(userPorts, availablePorts, singleOrRange, initialComparisonType, startDate, endDate, isExport, historicStart, historicEnd))
        }
    }
}

const mapState = (state: RootState) => {
    return {
        errors: state.pressureDashboard?.errors,
        singleOrRange: state.pressureDashboard?.singleOrRange,
        initialComparisonType: state.pressureDashboard?.comparisonType,
        forecastStart: state.pressureDashboard?.forecastStart,
        forecastEnd: state.pressureDashboard?.forecastEnd,
        historicStart: state.pressureDashboard?.historicStart,
        historicEnd: state.pressureDashboard?.historicEnd,
        status: state.pressureDashboard?.status,
    }
}

export default connect(mapState, mapDispatch)(RegionalPressureForm)
