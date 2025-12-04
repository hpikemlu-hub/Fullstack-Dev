#!/bin/bash

# ====================================================================
# VPS Setup Script for HPSB Workload Management System
# Prepares VPS for Coolify installation and deployment
# ====================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Please run as a regular user with sudo privileges."
    fi
}

# System requirements check
check_requirements() {
    log "Checking system requirements..."
    
    # Check Ubuntu version
    if [[ ! -f /etc/lsb-release ]] || ! grep -q "Ubuntu" /etc/lsb-release; then
        error "This script requires Ubuntu. Please use Ubuntu 22.04 LTS or later."
    fi
    
    # Check available memory (minimum 4GB)
    MEMORY_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    MEMORY_GB=$((MEMORY_KB / 1024 / 1024))
    
    if [[ $MEMORY_GB -lt 4 ]]; then
        warning "System has ${MEMORY_GB}GB RAM. Minimum 4GB recommended for production."
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log "✅ Memory check passed: ${MEMORY_GB}GB available"
    fi
    
    # Check disk space (minimum 20GB)
    DISK_SPACE=$(df / | tail -1 | awk '{print $4}')
    DISK_SPACE_GB=$((DISK_SPACE / 1024 / 1024))
    
    if [[ $DISK_SPACE_GB -lt 20 ]]; then
        warning "Available disk space: ${DISK_SPACE_GB}GB. Minimum 20GB recommended."
    else
        log "✅ Disk space check passed: ${DISK_SPACE_GB}GB available"
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    sudo apt-get update -qq
    sudo apt-get upgrade -y -qq
    sudo apt-get autoremove -y -qq
    log "✅ System updated successfully"
}

# Install essential packages
install_essentials() {
    log "Installing essential packages..."
    
    sudo apt-get install -y -qq \
        curl \
        wget \
        git \
        unzip \
        htop \
        nano \
        ufw \
        fail2ban \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        jq \
        tree
    
    log "✅ Essential packages installed"
}

# Configure firewall
setup_firewall() {
    log "Configuring UFW firewall..."
    
    # Reset UFW to default
    sudo ufw --force reset
    
    # Set default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH (be careful with this!)
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow Coolify ports
    sudo ufw allow 8080/tcp   # Coolify UI
    sudo ufw allow 6001/tcp   # Coolify WebSocket
    
    # Enable UFW
    sudo ufw --force enable
    
    log "✅ Firewall configured and enabled"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Remove old Docker installations
    sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update -qq
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Configure Docker daemon
    sudo mkdir -p /etc/docker
    cat << EOF | sudo tee /etc/docker/daemon.json
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "live-restore": true
}
EOF
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    log "✅ Docker installed and configured"
    log "⚠️  You'll need to log out and back in for Docker group membership to take effect"
}

# Setup fail2ban
setup_fail2ban() {
    log "Configuring fail2ban..."
    
    # Create custom jail configuration
    cat << EOF | sudo tee /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600
EOF
    
    # Restart fail2ban
    sudo systemctl restart fail2ban
    sudo systemctl enable fail2ban
    
    log "✅ Fail2ban configured and started"
}

# Optimize system for Docker
optimize_system() {
    log "Optimizing system for containerized workloads..."
    
    # Increase file limits
    cat << EOF | sudo tee /etc/security/limits.conf
* soft nofile 65535
* hard nofile 65535
root soft nofile 65535
root hard nofile 65535
EOF
    
    # Configure kernel parameters
    cat << EOF | sudo tee /etc/sysctl.d/99-docker.conf
# Network optimizations
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.core.netdev_max_backlog = 5000

# File system optimizations
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288

# Memory optimizations
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF
    
    # Apply sysctl settings
    sudo sysctl -p /etc/sysctl.d/99-docker.conf
    
    log "✅ System optimizations applied"
}

# Create backup directories
setup_directories() {
    log "Creating necessary directories..."
    
    sudo mkdir -p /opt/coolify/{data,backup,logs}
    sudo mkdir -p /opt/coolify/data/{postgres-prod,redis-prod,app-uploads}
    sudo mkdir -p /opt/coolify/backup/{postgres-prod,redis-prod}
    sudo mkdir -p /opt/coolify/staging/{postgres-data,redis-data,app-uploads}
    sudo mkdir -p /opt/coolify/logs/app
    
    # Set proper permissions
    sudo chown -R $USER:docker /opt/coolify
    sudo chmod -R 755 /opt/coolify
    
    log "✅ Directory structure created"
}

# Install Coolify
install_coolify() {
    log "Installing Coolify..."
    
    # Download and run Coolify installer
    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
    
    log "✅ Coolify installation completed"
    log "🌐 Coolify will be available at: https://$(curl -s ifconfig.me):8080"
    log "📝 Default credentials will be shown after installation"
}

# Create deployment user
create_deploy_user() {
    log "Setting up deployment user..."
    
    # Create deploy user if it doesn't exist
    if ! id "deploy" &>/dev/null; then
        sudo useradd -m -s /bin/bash deploy
        sudo usermod -aG docker deploy
        sudo usermod -aG sudo deploy
        
        # Setup SSH directory
        sudo mkdir -p /home/deploy/.ssh
        sudo chown deploy:deploy /home/deploy/.ssh
        sudo chmod 700 /home/deploy/.ssh
        
        log "✅ Deploy user created"
        log "📝 Remember to add your SSH public key to /home/deploy/.ssh/authorized_keys"
    else
        log "ℹ️  Deploy user already exists"
    fi
}

# Final security hardening
security_hardening() {
    log "Applying additional security hardening..."
    
    # Disable root SSH login
    sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    
    # Disable password authentication (optional - be careful!)
    read -p "Disable password authentication for SSH? (requires SSH key setup) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
        sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
        log "⚠️  Password authentication disabled - ensure SSH keys are configured!"
    fi
    
    # Restart SSH service
    sudo systemctl restart ssh
    
    log "✅ Security hardening applied"
}

# Display summary
show_summary() {
    log "=== VPS Setup Complete ==="
    echo -e "${BLUE}Server Information:${NC}"
    echo "  • IP Address: $(curl -s ifconfig.me)"
    echo "  • OS: $(lsb_release -d | cut -f2)"
    echo "  • Memory: ${MEMORY_GB}GB"
    echo "  • Disk Space: ${DISK_SPACE_GB}GB available"
    echo
    echo -e "${BLUE}Installed Services:${NC}"
    echo "  • Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
    echo "  • UFW Firewall: Active"
    echo "  • Fail2ban: Active"
    echo "  • Coolify: Ready for configuration"
    echo
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Log out and back in to apply Docker group membership"
    echo "  2. Access Coolify at: https://$(curl -s ifconfig.me):8080"
    echo "  3. Complete Coolify initial setup"
    echo "  4. Configure GitHub repository integration"
    echo "  5. Deploy HPSB Workload Management System"
    echo
    echo -e "${GREEN}🎉 VPS is ready for Coolify deployment!${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}"
    cat << EOF
╔═══════════════════════════════════════════════════════════════════╗
║                    VPS Setup for Coolify                         ║
║              HPSB Workload Management System                     ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    log "Starting VPS setup process..."
    
    check_root
    check_requirements
    update_system
    install_essentials
    setup_firewall
    install_docker
    setup_fail2ban
    optimize_system
    setup_directories
    create_deploy_user
    install_coolify
    security_hardening
    show_summary
    
    log "VPS setup completed successfully! 🎉"
}

# Run main function
main "$@"