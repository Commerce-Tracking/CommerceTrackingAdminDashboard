import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { FilterService } from 'primereact/api';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

interface Report {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string | Date;
  reportDate: string;
  reportTime: string;
  User: {
    firstname: string;
    lastname: string;
    email: string;
  };
  Country: {
    name: string;
  };
  Region: {
    name: string;
  };
  ReportType: {
    name: string;
  };
  Service: {
    name: string;
  };
  audioUrl?: string;
  images: Array<{ id: number; url: string }>;
  loadingNumber?: string;
}

interface ReportsTableProps {
  data: Report[];
  totalRecords: number;
  currentPage: number;
  rowsPerPage?: number;
  loading: boolean;
  onPageChange: (e: { first: number; page: number }) => void;
}

export default function ReportsTableOne(
    {
      data,
      totalRecords,
      currentPage,
      rowsPerPage = 10,
      loading,
      onPageChange,
    } : ReportsTableProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    FilterService.register('custom_date', (value, filters) => {
      const [from, to] = filters ?? [null, null];
      const date = new Date(value);
      if (!from && !to) return true;
      if (from && !to) return date >= new Date(from);
      if (!from && to) return date <= new Date(to);
      return date >= new Date(from) && date <= new Date(to);
    });
  }, []);

  const dateRangeFilterTemplate = (options: any) => {
    return (
        <div className="p-fluid">
          <div className="p-inputgroup">
            <input
                type="date"
                onChange={(e) => options.filterApplyCallback(e.target.value)}
            />
          </div>
        </div>
    );
  };

  const detailsBodyTemplate = (rowData: Report) => {
    return (
        <Button
            label="Voir"
            icon="pi pi-eye"
            className="p-button-sm p-button-primary"
            onClick={() => {
              setSelectedReport(rowData);
              setVisible(true);
            }}
        />
    );
  };

  const renderReportDetails = () => {
    if (!selectedReport) return null;

    return (
        <div className="p-4">
          <h3 className="text-lg font-bold mb-4">Détails du rapport</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Description :</strong> {selectedReport.description}</p>
              <p><strong>Statut :</strong> {selectedReport.status}</p>
              <p><strong>Date de création :</strong> {new Date(selectedReport.createdAt).toLocaleDateString()}</p>
              <p><strong>Date du rapport :</strong> {selectedReport.reportDate}</p>
              <p><strong>Heure du rapport :</strong> {selectedReport.reportTime}</p>
              <p><strong>Référence :</strong> {selectedReport.loadingNumber || '-'}</p>
            </div>
            <div>
              <p><strong>Utilisateur :</strong> {selectedReport.User.firstname} {selectedReport.User.lastname} ({selectedReport.User.email})</p>
              <p><strong>Pays :</strong> {selectedReport.Country.name}</p>
              <p><strong>Région :</strong> {selectedReport.Region.name}</p>
              <p><strong>Type de rapport :</strong> {selectedReport.ReportType.name}</p>
              <p><strong>Service concerné :</strong> {selectedReport.Service.name}</p>
            </div>
          </div>

          {/* Audio */}
          {selectedReport.audioUrl && (
              <div className="mt-4">
                <p><strong>Audio :</strong></p>
                <audio controls src={selectedReport.audioUrl} className="w-full" />
              </div>
          )}

          {/* Images */}
          {selectedReport.images.length > 0 && (
              <div className="mt-4">
                <p><strong>Images :</strong></p>
                <div className="flex flex-wrap gap-2">
                  {selectedReport.images.map((image) => (
                      <img
                          key={image.id}
                          src={image.url}
                          alt="Pièce jointe"
                          className="w-32 h-32 object-cover rounded shadow"
                      />
                  ))}
                </div>
              </div>
          )}
        </div>
    );
  };

  return (
      <div className="p-4">
        <DataTable
            value={data}
            loading={loading}
            responsiveLayout="scroll"
            showGridlines
            rows={rowsPerPage}
            first={(currentPage - 1) * rowsPerPage}
            totalRecords={totalRecords}
            // @ts-ignore
            onPage={onPageChange}
            filterDisplay="row"
            globalFilterFields={['description', 'status']}
            emptyMessage="Aucun rapport trouvé."
        >
          <Column field="title" header="Titre" filter filterPlaceholder="Rechercher un titre" />
          <Column field="description" header="Description" filter filterPlaceholder="Rechercher une description" />
          <Column field="status" header="Statut" filter filterPlaceholder="Filtrer par statut" />
          <Column
              field="createdAt"
              header="Date"
              body={(rowData) => new Date(rowData.createdAt).toLocaleDateString()}
              filter
              showFilterMenu={false}
              filterElement={dateRangeFilterTemplate}
          />
          <Column
              header="Détails"
              body={detailsBodyTemplate}
          />
        </DataTable>

        <Paginator
            first={(currentPage - 1) * rowsPerPage}
            rows={rowsPerPage}
            totalRecords={totalRecords}
            onPageChange={onPageChange}
        />

        <Dialog
            visible={visible}
            style={{ width: '50vw' }}
            onHide={() => setVisible(false)}
            footer={
              <div>
                <Button
                    label="Fermer"
                    icon="pi pi-times"
                    onClick={() => setVisible(false)}
                    className="px-3 py-1 text-sm text-white bg-gray-500 hover:bg-gray-600 rounded"
                />
              </div>
            }
        >
          {renderReportDetails()}
        </Dialog>
      </div>
  );
}