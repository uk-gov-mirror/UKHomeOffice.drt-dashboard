import * as React from 'react';
import Button from '@mui/material/Button';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {Stack} from "@mui/material";
import axios from "axios";
import {DatePicker, IsoDate} from '@drt/drt-react';
import ApiClient from "../services/ApiClient";

interface IProps {
  region: string;
  handleClose: () => void;
}

interface RegionExportRequest {
  region: string
  startDate: string
  endDate: string
}

export default function ExportDatePicker(props: IProps) {
  const [fromValue, setFromValue] = React.useState<IsoDate | null>(null);
  const [toValue, setToValue] = React.useState<IsoDate | null>(null);

  const rangeError = fromValue && toValue && fromValue > toValue
    ? 'The end date must be after the start date.'
    : undefined;

  const requestExport = () => {
    fromValue && toValue && !rangeError && axios.post(
      ApiClient.exportRegionEndpoint,
      {
        region: props.region,
        startDate: fromValue,
        endDate: toValue,
      } as RegionExportRequest,
    )
    props.handleClose()
  }

  return <>
    <Stack spacing={2} sx={{mt: 2}}>
      <DatePicker
        id="export-start-date"
        label="From Date"
        value={fromValue}
        onChange={setFromValue}
        error={rangeError}
      />
      <DatePicker
        id="export-end-date"
        label="To Date"
        value={toValue}
        onChange={setToValue}
        minDate={fromValue ?? undefined}
        error={rangeError}
      />
      <Button startIcon={<FileDownloadIcon/>}
              disabled={!fromValue || !toValue || !!rangeError}
              onClick={requestExport}
      >
        Request export
      </Button>
    </Stack>
  </>
}
