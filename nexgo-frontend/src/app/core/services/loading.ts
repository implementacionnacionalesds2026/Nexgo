import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  private isLoading = false;

  show(title: string = 'Cargando...') {
    if (this.isLoading) return;
    this.isLoading = true;
    
    Swal.fire({
      title: title,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: '#1e293b',
      color: '#ffffff',
      customClass: {
        popup: 'nx-swal-loading-popup'
      }
    });
  }

  hide() {
    if (!this.isLoading) return;
    this.isLoading = false;
    Swal.close();
  }
}
