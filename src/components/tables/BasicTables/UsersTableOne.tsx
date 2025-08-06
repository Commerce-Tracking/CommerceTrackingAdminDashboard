import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import axiosInstance from '../../../api/axios';
import ComponentCard from '../../common/ComponentCard';
import "primeicons/primeicons.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import {useTranslation} from "react-i18next";


interface User {
  id: string;
  phone: string;
  role: string;
  firstname: string;
  lastname: string;
  name: string;
}

interface ApiResponse {
  data: any[];
  total?: number;
  page?: number;
  limit?: number;
}

const UsersTableOne = () => {
  const [tableData, setTableData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get<ApiResponse>('/users', {
          params: { page: currentPage, limit: rowsPerPage },
        });
        console.log('Réponse API GET /users :', response.data);

        const transformedData: User[] = response.data.data.map((item: any) => ({
          id: item.id,
          phone: item.phone,
          role: item.role?.name || 'Inconnu',
          firstname: item.firstname,
          lastname: item.lastname,
          name: `${item.firstname} ${item.lastname}`,
        }));

        setTableData(transformedData);
        setTotalRecords(response.data.total || transformedData.length);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || 'Erreur lors de la récupération des utilisateurs.';
        setError(errorMessage);
        toast.current?.show({
          severity: 'error',
          summary: 'Erreur',
          detail: errorMessage,
          life: 3000,
        });
        setTableData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, rowsPerPage]);

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setTimeout(() => setIsModalVisible(true), 10);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  const onPageChange = (event: any) => {
    setCurrentPage(event.page + 1);
    setRowsPerPage(event.rows);
  };

   const { t, i18n } = useTranslation();
          
              const changeLanguage = (lng: string) => {
                  i18n.changeLanguage(lng);
              };

  const actionBodyTemplate = (rowData: User) => {
    return (
      <button
        onClick={() => handleViewDetails(rowData)}
        className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        Voir détails
      </button>
    );
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>Erreur : {error}</div>;
  }

  return (
    <div className="p-4">
      <ComponentCard title={t('user_list')}>
        <DataTable
          value={tableData}
          loading={isLoading}
          responsiveLayout="scroll"
          showGridlines
          rows={rowsPerPage}
          first={(currentPage - 1) * rowsPerPage}
          totalRecords={totalRecords}
          onPage={onPageChange}
          filterDisplay="row"
          globalFilterFields={['name', 'phone', 'role']}
          emptyMessage="Aucun utilisateur trouvé."
          paginator
          rowsPerPageOptions={[5, 10, 25]}
          tableStyle={{ minWidth: '50rem' }}
          className="p-datatable-sm"
        >
          <Column
            field="name"
            header={t('user')}
            filter
            filterPlaceholder="Rechercher par nom"
            style={{ width: '30%' }}
          />
          <Column
            field="phone"
            header={t('phone')}
            filter
            filterPlaceholder="Rechercher par téléphone"
            style={{ width: '30%' }}
          />
          <Column
            field="role"
            header={t('position')}
            filter
            filterPlaceholder="Rechercher par poste"
            style={{ width: '20%' }}
          />
          <Column
            header={t('actions')}
            body={actionBodyTemplate}
            style={{ width: '20%' }}
          />
        </DataTable>
      </ComponentCard>
      <Dialog
        visible={isModalVisible}
        header={t('user_details')}
        modal
        style={{ width: '30rem' }}
        onHide={handleCloseModal}
      >
        {selectedUser && (
          <div className="p-4 space-y-2">
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">{t('full_name')} :</span> {selectedUser.name}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">{t('pers_first_name')} :</span> {selectedUser.firstname}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">{t('pers_name')} :</span> {selectedUser.lastname}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">{t('phone')} :</span> {selectedUser.phone}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">{t('position')} :</span> {selectedUser.role}
            </p>
            <div className="flex justify-end mt-4">
              <Button
                label="Fermer"
                icon="pi pi-times"
                className="p-button-secondary"
                onClick={handleCloseModal}
              />
            </div>
          </div>
        )}
      </Dialog>
      <Toast ref={toast} position="bottom-right" />
    </div>
  );
};

export default UsersTableOne;