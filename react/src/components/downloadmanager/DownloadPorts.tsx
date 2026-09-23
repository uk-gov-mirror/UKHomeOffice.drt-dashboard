import * as React from 'react';
import { Theme, useTheme } from '@mui/material/styles';
import {Box, FormControl, Select, Chip, MenuItem, OutlinedInput, InputLabel, Accordion, AccordionSummary, AccordionDetails, SelectChangeEvent} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Cancel } from '@mui/icons-material';
import {Checkboxes} from '@drt/drt-react';

interface Region {
  name: string;
  ports: string[];
}

interface DownloadPortsProps {
  error: boolean,
  handlePortChange: (event: SelectChangeEvent<string[]>) => void,
  handleRemovePort: (port:string) => void;
  onSelectedPortsChange: (ports: string[]) => void;
  portsByRegion: Region[],
  selectedPorts: string[],
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(port: string, selectedPorts: readonly string[], theme: Theme) {
  return {
    fontWeight:
        selectedPorts.indexOf(port) === -1
            ? theme.typography.fontWeightRegular
            : theme.typography.fontWeightMedium,
  };
}

export default function DownloadPorts({error, handlePortChange, handleRemovePort, onSelectedPortsChange, portsByRegion, selectedPorts}: DownloadPortsProps) {
  const theme = useTheme();
  const [expandedTab, setExpandedTab] = React.useState<string>('');

  const sortedRegions = portsByRegion.map(region => ({
    ...region,
    ports: [...region.ports].sort(),
  }));
  const allUserPorts: string[] = [...new Set(sortedRegions.flatMap(region => region.ports))];

  const updateRegionPorts = (regionPorts: string[], regionSelection: string[]) => {
    const selected = new Set([
      ...selectedPorts.filter(port => !regionPorts.includes(port)),
      ...regionSelection,
    ]);
    onSelectedPortsChange(allUserPorts.filter(port => selected.has(port)));
  };

  const updateWholeRegion = (regionName: string, regionPorts: string[], values: string[]) => {
    if (values.includes(regionName)) {
      updateRegionPorts(regionPorts, regionPorts);
      setExpandedTab(regionName);
    } else {
      updateRegionPorts(regionPorts, []);
      setExpandedTab('');
    }
  };

  return (
      <Box>
        <h3>Ports / Regions</h3>
        <FormControl sx={{width: '100%', backgroundColor: '#fff', marginBottom: '1em' }}>
          <InputLabel id="elected-ports-label">Ports</InputLabel>
          <Select
              error={error}
              labelId="selected-ports-label"
              id="selected-ports"
              multiple
              value={selectedPorts}
              onChange={handlePortChange}
              sx={{fontSize: '22px'}}
              input={<OutlinedInput id="select-multiple-chip" label="Chip" />}
              renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                        <Chip
                            clickable
                            deleteIcon={
                              <Cancel
                                  onMouseDown={(event) => event.stopPropagation()}
                              />
                            }
                            key={value}
                            label={value}
                            onDelete={() => handleRemovePort(value)}
                        />
                    ))}
                  </Box>
              )}
              MenuProps={MenuProps}
          >
            { allUserPorts.map((port) =>
                <MenuItem
                    key={port}
                    value={port}
                    style={getStyles(port, selectedPorts, theme)}
                >
                  {port}
                </MenuItem> )}
          </Select>
        </FormControl>
        <div>
          {
            sortedRegions.map((region: Region) => {
              const selectedRegionPorts = region.ports.filter(port => selectedPorts.includes(port));
              return (
                  <Accordion
                      key={region.name}
                      expanded={expandedTab === region.name}
                      onChange={(_, expanded) => setExpandedTab(expanded ? region.name : '')}
                  >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`${region.name}-ports-content`}
                        id={`${region.name}-ports-header`}
                        sx={{margin: '12px 0 !important'}}
                    >
                      <Box onClick={event => event.stopPropagation()}>
                        <Checkboxes
                            name={`region-${region.name}`}
                            idPrefix={`region-${region.name}`}
                            options={[{value: region.name, label: region.name}]}
                            value={selectedRegionPorts.length > 0 ? [region.name] : []}
                            onChange={values => updateWholeRegion(region.name, region.ports, values)}
                            small
                        />
                      </Box>
                      <Chip sx={{marginLeft: '1em'}} label={`${region.ports.filter(port => selectedPorts.includes(port)).length} selected`} />

                    </AccordionSummary>
                    <AccordionDetails id={`${region.name}-ports-content`}>
                      <Checkboxes
                          name={`ports-${region.name}`}
                          idPrefix={`ports-${region.name}`}
                          label={`${region.name} ports`}
                          legendSize="s"
                          options={region.ports.map(port => ({value: port, label: port}))}
                          value={selectedRegionPorts}
                          onChange={values => updateRegionPorts(region.ports, values)}
                          inline
                          small
                      />
                    </AccordionDetails>
                  </Accordion>)
            })
          }
        </div>
      </Box>
  )
}
