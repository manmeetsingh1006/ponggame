# Azure VM Details Enhancement Plan

## Current State Analysis

**Current Azure VM fetching location:** [backend/app/api/v1/metrics.py](backend/app/api/v1/metrics.py#L815-L875)

### What Currently Gets Fetched:
1. **Basic VM Info:**
   - VM name/ID
   - VM size (e.g., Standard_B2s)
   - Power state (running/stopped/deallocated)
   - OS type (only Linux/Windows label)
   - OS version (publisher + offer + SKU string)
   - Computer name
   - Location/Region

2. **Network Info:**
   - Private IP
   - Public IP

3. **Limited Details:**
   - Resource group

### Current Issue:
**OS Details are INCOMPLETE:**
- Only shows `os_type` (Linux/Windows) as a generic label
- No specific OS version numbers (e.g., Windows 10, Windows Server 2019)
- No OS build/version details
- No detailed image information

---

## Proposed Enhancements

### Phase 1: Enhanced OS Version Detection
**What we'll add:**

1. **OS Version Extraction** (DETAILED)
   - Parse image reference more comprehensively:
     - Publisher (e.g., "MicrosoftWindowsServer")
     - Offer (e.g., "WindowsServer")
     - SKU (e.g., "2019-Datacenter", "2022-Datacenter-Core")
   - Extract specific OS version from SKU (Windows Server 2019, 2022, Windows 11, etc.)
   - Build/patch version if available

2. **VM Creation Metadata**
   - Creation time/date
   - Last modification time
   - Tags (for cost center, environment tracking)
   - VM status details (provisioning state)

3. **CPU Utilization & Performance**
   - Average CPU utilization (last 1 hour, 24 hours)
   - Peak CPU usage
   - CPU cores information from vm_size
   - Memory information from vm_size
   - *Requires Azure Monitor/Application Insights API call*

### Phase 2: Storage Component Details
**What we'll add:**

1. **OS Disk Details**
   - Disk name
   - Disk size (GB)
   - Disk type (Premium SSD, Standard SSD, Standard HDD)
   - Caching policy (ReadWrite, ReadOnly, None)
   - Encryption status

2. **Data Disks**
   - Count and sizes
   - Types and caching
   - LUN (Logical Unit Number)
   - Encryption status
   - Unused/Unattached disk warnings

### Phase 3: Network Component Details
**What we'll add:**

1. **Network Interface Details**
   - Network interface count
   - Primary NIC identification
   - IP configuration details
   - DNS settings

2. **Associated Networking Resources**
   - Virtual Network (VNet) name
   - Subnet information
   - Network Security Group (NSG) rules count
   - Public IP details (allocation method, SKU)

3. **Network Performance**
   - Inbound/Outbound bandwidth usage
   - Packets sent/received metrics
   - *Requires Azure Monitor API*

### Phase 4: Security Component Details
**What we'll add:**

1. **VM Extensions & Security**
   - Installed VM extensions list (antivirus, backup agent, monitoring, etc.)
   - Extension versions
   - Protection status

2. **Disk Encryption**
   - BitLocker/Azure Disk Encryption status
   - Encryption algorithm

3. **Access & Compliance**
   - Identity/Managed Service Identity (MSI) attached
   - Role assignments
   - Compliance status

4. **Firewall & NSG Rules**
   - Associated NSG rules affecting VM
   - Inbound/Outbound rule counts
   - Public accessibility status

### Phase 5: Dependency Information
**What we'll add:**

1. **Load Balancer & Traffic**
   - Backend pool association
   - Health probe status
   - Traffic distribution details

2. **Storage Account Association**
   - Boot diagnostics storage account
   - Log storage details

3. **Diagnostic & Monitoring**
   - Diagnostics extension status
   - Application Insights association
   - Azure Backup status

---

## Implementation Details

### Files to Modify:

1. **[backend/app/api/v1/metrics.py](backend/app/api/v1/metrics.py#L815-L875)**
   - Enhance `fetch_azure_resources()` function
   - Add CPU utilization fetching from Azure Monitor
   - Expand VM data structure with new fields
   - Lines: ~815-875 (VM section)

2. **[backend/app/api/v1/metrics.py](backend/app/api/v1/metrics.py#L1778-L1900)**
   - Enhance `fetch_azure_resource_details()` function
   - Add in-depth details retrieval for individual VMs
   - Lines: ~1778-1900 (VM details section)

3. **[backend/app/services/normalizer.py](backend/app/services/normalizer.py#L140-L160)**
   - Update Azure normalization schema
   - Add new fields to common response format
   - Lines: ~140-160 (Azure-specific normalization)

### New Data Structure for Azure VMs:

**From:**
```python
{
    "id": "vm-name",
    "size": "Standard_B2s",
    "state": "running",
    "os_type": "Windows",
    "os_version": "MicrosoftWindowsServer WindowsServer 2019-Datacenter",
    "computer_name": "MYVM01",
    "private_ip": "10.0.1.4",
    "public_ip": "20.123.45.67",
    "location": "eastus",
    "resource_group": "myresourcegroup"
}
```

**To:**
```python
{
    "id": "vm-name",
    "name": "vm-name",
    "size": "Standard_B2s",
    "state": "running",
    "location": "eastus",
    "resource_group": "myresourcegroup",
    
    # OS Information (ENHANCED)
    "os": {
        "type": "Windows",
        "publisher": "MicrosoftWindowsServer",
        "offer": "WindowsServer",
        "sku": "2019-Datacenter",
        "version": "Windows Server 2019 Datacenter",
        "full_details": {...}  # Image reference details
    },
    "computer_name": "MYVM01",
    "created_at": "2024-01-15T10:30:00Z",
    "provisioning_state": "Succeeded",
    
    # CPU & Performance (NEW)
    "cpu": {
        "cores": 2,
        "memory_gb": 4,
        "cpu_platform": "Intel Xeon Platinum 8370C",
        "utilization": {
            "current": 35.5,      # %
            "avg_1h": 32.2,
            "avg_24h": 28.5,
            "peak_1h": 78.3
        }
    },
    
    # Storage (ENHANCED)
    "storage": {
        "os_disk": {
            "name": "os-disk-01",
            "size_gb": 128,
            "type": "Premium_LRS",
            "caching": "ReadWrite",
            "encryption": "Enabled"
        },
        "data_disks": [
            {
                "name": "data-disk-01",
                "size_gb": 256,
                "type": "Premium_LRS",
                "lun": 0,
                "caching": "ReadWrite",
                "attached": True
            }
        ],
        "unattached_disks_count": 0
    },
    
    # Network (ENHANCED)
    "network": {
        "primary_ip": {
            "private": "10.0.1.4",
            "public": "20.123.45.67",
            "public_allocation": "Static"
        },
        "interfaces": [
            {
                "name": "nic-01",
                "primary": True,
                "ip_configs": [...],
                "dns_servers": [...]
            }
        ],
        "vnet": "my-vnet",
        "subnet": "subnet-1",
        "nsg_rules": {
            "inbound_count": 5,
            "outbound_count": 3,
            "public_access": "Partial"
        }
    },
    
    # Security (NEW)
    "security": {
        "extensions": [
            {
                "name": "MicrosoftMonitoringAgent",
                "publisher": "Microsoft.EnterpriseCloud.Monitoring",
                "type": "MicrosoftMonitoringAgent",
                "version": "1.0.13804.1"
            }
        ],
        "disk_encryption": {
            "enabled": True,
            "algorithm": "AES-256"
        },
        "msi": {
            "enabled": True,
            "identity_id": "/subscriptions/.../userAssignedIdentities/..."
        },
        "backup_status": "Protected"
    },
    
    # Dependencies (NEW)
    "dependencies": {
        "load_balancer": "my-lb-01",
        "backup_vault": "backup-vault-01",
        "diagnostics_storage": "diagstg123",
        "monitoring": {
            "app_insights": "my-app-insights",
            "log_analytics": "my-workspace"
        }
    }
}
```

---

## API Changes Required:

### 1. New Azure Monitor Client Import
- Add Azure Monitor metrics client
- Enable CPU utilization collection

### 2. Credential Permissions
- Ensure Service Principal has Reader role (already typically has)
- Or roles: `Microsoft.Insights/metrics/read` for metrics

### 3. Performance Considerations
- Current fetch is ~1-2 seconds per VM
- Enhanced fetch may be ~3-5 seconds per VM (due to Monitor API calls)
- Consider batching metrics calls for better performance

---

## Benefits of These Enhancements:

1. **Better Cost Optimization:**
   - CPU utilization helps identify oversized VMs
   - Unattached disk detection for cleanup recommendations

2. **Improved Security Posture:**
   - NSG rules visibility
   - Encryption status monitoring
   - Extension/backup agent tracking

3. **Better Resource Management:**
   - Dependency visibility prevents accidental deletions
   - Creation date tracking for lifecycle management
   - Tags support for cost allocation

4. **Compliance & Auditing:**
   - Disk encryption status
   - Backup coverage verification
   - Security extension validation

---

## Timeline Estimate:
- **Phase 1 (OS & Metadata):** 1-2 hours
- **Phase 2 (Storage):** 1 hour
- **Phase 3 (Network):** 1-2 hours
- **Phase 4 (Security):** 1-2 hours
- **Phase 5 (Dependencies):** 1 hour
- **Testing & Validation:** 1-2 hours

**Total: ~7-10 hours of work**

---

## Next Steps:
1. **Await your approval** on this plan
2. Confirm which phases you want implemented
3. Discuss any specific fields or priorities
4. Proceed with implementation once approved

