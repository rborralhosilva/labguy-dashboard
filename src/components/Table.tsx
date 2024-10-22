import { useContext, useMemo, useState } from 'react';
import {
  type MRT_ColumnDef,
  useMaterialReactTable,
  MRT_EditActionButtons,
  MRT_Row,
  MaterialReactTable,
  createRow,
  MRT_TableOptions
} from 'material-react-table';
import { useNavigate, useRouteLoaderData } from 'react-router-dom';
import {
  GeneralSectionSchema,
  PostSchema,
  ProjectSchema,
  WorkSchema
} from '@jakubkanna/labguy-front-schema';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import useRequest from '../hooks/useRequest';
import { GeneralContext } from '../contexts/GeneralContext';

// Extend each schema by adding the 'general' property
type WorkSchemaWithGeneral = WorkSchema & {
  general: GeneralSectionSchema;
};

type ProjectSchemaWithGeneral = ProjectSchema & {
  general: GeneralSectionSchema;
};

type PostSchemaWithGeneral = PostSchema & {
  general: GeneralSectionSchema;
};

// DataType to include the new versions of each schema
type DataType =
  | WorkSchemaWithGeneral
  | ProjectSchemaWithGeneral
  | PostSchemaWithGeneral;

// Example component definition
export const Table = <T extends DataType>() => {
  // Fetch data based on the current route
  const path = window.location.pathname.split('/').pop() || '';
  const navigate = useNavigate();
  const initData = useRouteLoaderData(path) as T[];
  const { createData, deleteData } = useRequest<T>();

  // state
  const { token } = useContext(GeneralContext);
  const [data, setData] = useState(() => initData);

  // Define table columns using useMemo for performance optimization
  const columns = useMemo<MRT_ColumnDef<T>[]>(
    () => [
      {
        accessorKey: 'general.title',
        header: 'Title',
        grow: true
      },
      {
        accessorKey: 'general.fIndex',
        header: 'fIndex',
        enableEditing: false
      },
      {
        accessorKey: 'general.published',
        header: 'Published',
        enableEditing: false,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value ? <CheckIcon /> : <ClearIcon />;
        },
        size: 0
      }
    ],
    []
  );

  //CREATE action
  const handleCreateEntry: MRT_TableOptions<T>['onCreatingRowSave'] = async ({
    values,
    table
  }) => {
    const newEntry: T = {
      general: {
        title: values['general.title'],
        published: values['general.published']
      }
    } as T; // Type assertion to match T
    const createdEntry = await createData(newEntry, path, token);
    setData((prevData) => [createdEntry, ...prevData]);
    table.setCreatingRow(null); // exit creating mode
  };

  //UPDATE action
  const handleEditClick = (id: string | number) => () =>
    navigate(`update/${id}`);

  //DELETE action
  const openDeleteConfirmModal = async (row: MRT_Row<T>) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${row.original.general.title}"?`
    );
    const generalId = row.original.generalId;

    if (confirmDelete && generalId !== undefined) {
      await deleteData(path, generalId as number, token);
      setData((prevData) =>
        prevData.filter((entry) => entry.generalId !== generalId)
      );
    }
  };

  // Initialize the table instance with the configuration
  const table = useMaterialReactTable<T>({
    columns,
    data,
    initialState: {
      columnVisibility: {
        ['general.fIndex']: false
      }
    },
    enableColumnResizing: true,
    layoutMode: 'grid',
    enableKeyboardShortcuts: false,
    enableColumnActions: true,
    positionActionsColumn: 'last',
    enableRowActions: true,
    enableColumnFilters: false,
    enablePagination: true,
    enableSorting: false,
    createDisplayMode: 'row',
    enableEditing: true,

    mrtTheme: (theme) => ({
      baseBackgroundColor: theme.palette.background.default
    }),
    muiTableBodyRowProps: { hover: false },
    muiTableProps: {
      sx: {
        border: '1px solid rgba(81, 81, 81, .5)',
        caption: {
          captionSide: 'top'
        }
      }
    },
    muiTableHeadCellProps: {
      sx: {
        border: '1px solid rgba(81, 81, 81, .5)',
        fontStyle: 'italic',
        fontWeight: 'normal'
      }
    },
    muiTableBodyCellProps: {
      sx: {
        border: '1px solid rgba(81, 81, 81, .5)'
      }
    },
    onCreatingRowSave: handleCreateEntry,
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {row.original.id && (
          <Tooltip title="Edit">
            <IconButton size="small" onClick={handleEditClick(row.original.id)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={() => openDeleteConfirmModal(row)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    renderCreateRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle variant="h3">Add new</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {internalEditComponents}
        </DialogContent>
        <DialogActions>
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </DialogActions>
      </>
    ),
    renderTopToolbarCustomActions: () => {
      return (
        <Box sx={{ display: 'flex', gap: '1rem', p: '4px' }}>
          <Button
            onClick={() => {
              table.setCreatingRow(
                createRow(table, {
                  general: {
                    title: '',
                    published: false
                  }
                } as T)
              );
            }}
          >
            Add new
          </Button>
        </Box>
      );
    },
    renderToolbarInternalActions: () => <></>
  });

  return <MaterialReactTable table={table} />;
};

export default Table;
